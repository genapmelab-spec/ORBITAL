import { CAMERA_PARAMS, DESTINATIONS, type StationId } from '../../content/experience.ts';
import {
  BODIES,
  KEY_BY_ID,
  projectPoint,
  projectedRadius,
  type CameraFrame,
  type SubjectPositions,
} from '../camera/anchors.ts';

/**
 * Spatial annotations.
 *
 * Each destination carries a small label anchored to the body itself: a hairline
 * reaching out to the name and one measured number. This is the seam where the
 * interface and the 3D world are the same system — the label is not positioned
 * by hand, it is projected from the body's real place in the model every frame,
 * and it exists only while its station is on screen.
 *
 * The layer is `aria-hidden`: every word here also exists in the section copy,
 * so assistive technology reads the page, not the decoration.
 */

export interface AnnotationContext {
  readonly param: number;
  readonly frame: CameraFrame;
  readonly positions: SubjectPositions;
  readonly width: number;
  readonly height: number;
  /** Nav bar height, so a label never hides under the chrome. */
  readonly topInset: number;
}

export interface AnnotationsHandle {
  update(ctx: AnnotationContext): void;
  dispose(): void;
}

/** Where the subject sits on screen for a destination's camera key. */
function anchorFrameX(id: StationId): number {
  return KEY_BY_ID[id].frameX;
}

interface Entry {
  readonly id: StationId;
  readonly keyParam: number;
  /** Which way the label leans: away from the body, toward the frame edge. */
  readonly side: 1 | -1;
  readonly element: HTMLDivElement;
  visible: boolean;
}

export const ANNOTATION_MIN_WIDTH = 768;
const FADE_FROM = 0.1;
const FADE_TO = 0.34;
const CLEARANCE_PX = 26;

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

export function createAnnotations(layer: HTMLElement): AnnotationsHandle {
  const entries: Entry[] = [];

  for (const destination of DESTINATIONS) {
    const element = document.createElement('div');
    element.className = 'annotation';
    element.setAttribute('aria-hidden', 'true');
    element.dataset.station = destination.id;
    // The label leans away from its body: read straight off the camera key, so
    // the label and the shot can never disagree about which side the subject is on.
    element.dataset.side = anchorFrameX(destination.id) < 0 ? '-1' : '1';

    const rule = document.createElement('span');
    rule.className = 'annotation__rule';
    const body = document.createElement('span');
    body.className = 'annotation__body';
    const name = document.createElement('span');
    name.className = 'annotation__name';
    name.textContent = destination.annotation;
    const metric = document.createElement('span');
    metric.className = 'annotation__metric';
    metric.textContent = destination.metric;

    body.append(name, metric);
    element.append(rule, body);
    layer.append(element);

    entries.push({
      id: destination.id,
      keyParam: CAMERA_PARAMS[destination.id],
      side: anchorFrameX(destination.id) < 0 ? -1 : 1,
      element,
      visible: false,
    });
  }

  function hide(entry: Entry): void {
    if (entry.visible) {
      entry.element.style.opacity = '0';
      entry.element.style.visibility = 'hidden';
      entry.visible = false;
    }
  }

  return {
    update(ctx: AnnotationContext): void {
      const narrow = ctx.width < ANNOTATION_MIN_WIDTH;
      for (const entry of entries) {
        if (narrow) {
          hide(entry);
          continue;
        }
        const distance = Math.abs(ctx.param - entry.keyParam);
        const opacity = 1 - smoothstep(FADE_FROM, FADE_TO, distance);
        if (opacity <= 0.01) {
          hide(entry);
          continue;
        }

        const position = ctx.positions[entry.id];
        const projection = projectPoint(position, ctx.frame);
        if (projection.depth <= 0.2) {
          hide(entry);
          continue;
        }

        const halfWidth = ctx.width / 2;
        const halfHeight = ctx.height / 2;
        const x = halfWidth + projection.x * halfWidth;
        const y = halfHeight - projection.y * halfHeight;

        // The belt has no body: its annotation anchors to the point itself.
        const radiusPx =
          entry.id === 'belt'
            ? 0
            : projectedRadius(BODIES[entry.id].radius, projection.depth, ctx.frame) * halfHeight;
        const labelX = x + entry.side * (radiusPx + CLEARANCE_PX);
        const labelY = y - 10;

        if (labelX < 8 || labelX > ctx.width - 8 || labelY < ctx.topInset || labelY > ctx.height - 40) {
          hide(entry);
          continue;
        }

        entry.element.style.transform = `translate3d(${labelX.toFixed(1)}px, ${labelY.toFixed(1)}px, 0)`;
        entry.element.style.setProperty('--rule-direction', entry.side === 1 ? '-1' : '1');
        entry.element.style.opacity = opacity.toFixed(3);
        entry.element.style.visibility = 'visible';
        entry.visible = true;
      }
    },
    dispose(): void {
      for (const entry of entries) {
        entry.element.remove();
      }
      entries.length = 0;
    },
  };
}
