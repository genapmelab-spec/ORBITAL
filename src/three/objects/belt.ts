import {
  Color,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Quaternion,
  ShaderMaterial,
  Vector3,
} from 'three';
import { ROCK_FRAGMENT, ROCK_VERTEX } from '../shaders/rock.ts';
import {
  BELT_INNER_AU,
  BELT_MEAN_AU,
  BELT_MEAN_PHASE_AT_J2000,
  BELT_OUTER_AU,
  BELT_THICKNESS_RATIO,
  daysSinceJ2000,
  orbitalRatePerDay,
} from '../systems/epoch.ts';
import { toSceneRadius } from '../camera/anchors.ts';
import { createRandom, randomDirection } from '../systems/random.ts';
import type { FrameContext, SceneObject } from '../types.ts';

/**
 * The asteroid belt — the place where the Solar System stops being about
 * planets. One instanced draw, one material, no per-frame geometry work.
 *
 * Two populations, because the belt needs to be honest *and* legible:
 *
 * - the **field**: rocks spread over the real 2.2 – 3.2 AU annulus, so the whole
 *   ring reads as a ring from outside and the inner edge visibly outruns the
 *   outer edge, since every rate comes from Kepler's third law;
 * - the **weather**: a local cloud of larger rocks around the point the flight
 *   crosses, which is why the copy can say rock starts behaving like weather
 *   without pretending the belt is crowded. It is still emptier than any picture
 *   of it ever suggests.
 */

export const BELT_FIELD_COUNT = 1500;
export const BELT_CLOUD_COUNT = 200;
export const BELT_CAPACITY = BELT_FIELD_COUNT + BELT_CLOUD_COUNT;
export const BELT_SEED = 0x7a3c11;
export const BELT_ROCK_MIN = 0.08;
export const BELT_ROCK_MAX = 1.3;
export const BELT_CLOUD_INNER = 1.8;
export const BELT_CLOUD_OUTER = 15;

export interface BeltHandle extends SceneObject {
  /** Fraction of the allocated rocks to draw (0..1) — the quality lever. */
  setDensity(fraction: number): void;
  /** Re-place every rock for a new date. */
  setEpoch(date: Date): void;
}

interface Rock {
  readonly angleAtJ2000: number;
  readonly ratePerDay: number;
  readonly radiusScene: number;
  readonly height: number;
  readonly size: Vector3;
  readonly axis: Vector3;
  readonly spin: number;
  /** Cloud rocks orbit with the crossing point, not with the mean belt. */
  readonly cloudAngleOffset: number;
  readonly cloudRadialOffset: number;
}

export function createBelt(lightColor: Color, sunDirection: Vector3): BeltHandle {
  const random = createRandom(BELT_SEED);
  const geometry = new IcosahedronGeometry(1, 0);
  const material = new ShaderMaterial({
    vertexShader: ROCK_VERTEX,
    fragmentShader: ROCK_FRAGMENT,
    uniforms: {
      uBaseColor: { value: new Color('#7d7469') },
      uAccentColor: { value: new Color('#3b3630') },
      uLightColor: { value: lightColor.clone() },
      uSunDirection: { value: sunDirection.clone() },
    },
  });

  const mesh = new InstancedMesh(geometry, material, BELT_CAPACITY);
  mesh.frustumCulled = false;

  const rocks: Rock[] = [];
  const cloudRadius = toSceneRadius(BELT_MEAN_AU);

  // The cloud is generated first: `setDensity` trims the tail of the instance
  // buffer, and the crossing must be the last thing to disappear.
  for (let index = 0; index < BELT_CLOUD_COUNT; index += 1) {
    const distance =
      BELT_CLOUD_INNER + Math.pow(random(), 0.7) * (BELT_CLOUD_OUTER - BELT_CLOUD_INNER);
    const direction = random() * Math.PI * 2;
    const size = 0.14 + random() * 0.62;
    const [ax, ay, az] = randomDirection(random);
    rocks.push({
      angleAtJ2000: 0,
      ratePerDay: orbitalRatePerDay(BELT_MEAN_AU),
      radiusScene: cloudRadius,
      height: (random() * 2 - 1) * Math.min(distance * 0.35, 3.4),
      size: randomScale(random, size),
      axis: new Vector3(ax, ay, az).normalize(),
      spin: random() * Math.PI,
      cloudAngleOffset: (Math.cos(direction) * distance) / cloudRadius,
      cloudRadialOffset: Math.sin(direction) * distance,
    });
  }

  for (let index = 0; index < BELT_FIELD_COUNT; index += 1) {
    const au = BELT_INNER_AU + (BELT_OUTER_AU - BELT_INNER_AU) * Math.pow(random(), 0.85);
    const radiusScene = toSceneRadius(au);
    // Power law: mostly gravel, a few boulders, so the field never looks like
    // uniform confetti.
    const size = BELT_ROCK_MIN + (BELT_ROCK_MAX - BELT_ROCK_MIN) * Math.pow(random(), 2.6);
    const [ax, ay, az] = randomDirection(random);
    rocks.push({
      angleAtJ2000: random() * Math.PI * 2,
      ratePerDay: orbitalRatePerDay(au),
      radiusScene,
      height: (random() * 2 - 1) * BELT_THICKNESS_RATIO * radiusScene,
      size: randomScale(random, size),
      axis: new Vector3(ax, ay, az).normalize(),
      spin: random() * Math.PI,
      cloudAngleOffset: 0,
      cloudRadialOffset: 0,
    });
  }

  const matrix = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3();

  function place(date: Date): void {
    const days = daysSinceJ2000(date);
    const cloudAngle = BELT_MEAN_PHASE_AT_J2000 + orbitalRatePerDay(BELT_MEAN_AU) * days;

    for (let index = 0; index < rocks.length; index += 1) {
      const rock = rocks[index] as Rock;
      const isCloud = index < BELT_CLOUD_COUNT;
      const angle = isCloud
        ? cloudAngle + rock.cloudAngleOffset
        : rock.angleAtJ2000 + rock.ratePerDay * days;
      const radius = isCloud ? rock.radiusScene + rock.cloudRadialOffset : rock.radiusScene;
      position.set(Math.cos(angle) * radius, rock.height, Math.sin(angle) * radius);
      rotation.setFromAxisAngle(rock.axis, rock.spin + days * 0.02);
      scale.copy(rock.size);
      matrix.compose(position, rotation, scale);
      mesh.setMatrixAt(index, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  place(new Date());
  mesh.count = BELT_CAPACITY;

  return {
    root: mesh,
    update(_ctx: FrameContext): void {
      // Motion belongs to the model, not to the renderer: a still date means a
      // still belt, and `setEpoch` is the only thing that moves it.
    },
    setDensity(fraction: number): void {
      const safe = Math.min(Math.max(fraction, 0), 1);
      // The cloud is trimmed last: it is what makes the crossing legible.
      mesh.count =
        Math.round(BELT_CLOUD_COUNT * Math.min(safe * 1.6, 1)) +
        Math.round(BELT_FIELD_COUNT * safe);
    },
    setEpoch(date: Date): void {
      place(date);
    },
    dispose(): void {
      geometry.dispose();
      material.dispose();
      mesh.removeFromParent();
    },
  };
}

function randomScale(random: () => number, size: number): Vector3 {
  return new Vector3(
    size * (0.6 + random() * 0.8),
    size * (0.6 + random() * 0.8),
    size * (0.6 + random() * 0.8),
  );
}
