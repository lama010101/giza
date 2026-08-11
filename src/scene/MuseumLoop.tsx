import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/app';
import { getMuseumPresets, type MuseumPreset } from './museumPresets';
import type { Vector3 } from '@/schemas/location';

const TRANSITION_SECONDS = 2;
const IDLE_TIMEOUT_MS = 10000;

interface OrbitControlsLike {
  target: THREE.Vector3;
  object: THREE.Camera;
  update: () => void;
  enabled: boolean;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerpVector(a: Vector3, b: Vector3, t: number, out: THREE.Vector3): void {
  out.x = a.x + (b.x - a.x) * t;
  out.y = a.y + (b.y - a.y) * t;
  out.z = a.z + (b.z - a.z) * t;
}

export function MuseumLoop(): JSX.Element | null {
  const mode = useAppStore((s) => s.mode);
  const activeMonument = useAppStore((s) => s.activeMonument);
  const museumPaused = useAppStore((s) => s.museumPaused);
  const { camera } = useThree();
  const controls = useThree((state) => state.controls) as OrbitControlsLike | null;

  const presetsRef = useRef<MuseumPreset[]>(getMuseumPresets(activeMonument));
  const indexRef = useRef(0);
  const timeRef = useRef(0);
  const pausedRef = useRef(museumPaused);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPresetNameRef = useRef<string | null>(null);

  useEffect(() => {
    pausedRef.current = museumPaused;
    if (!museumPaused && resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, [museumPaused]);

  useEffect(() => {
    presetsRef.current = getMuseumPresets(activeMonument);
    indexRef.current = 0;
    timeRef.current = 0;
    const first = presetsRef.current[0]?.name ?? null;
    if (first !== lastPresetNameRef.current) {
      lastPresetNameRef.current = first;
      useAppStore.getState().setMuseumPresetName(first);
    }
  }, [activeMonument]);

  useEffect(() => {
    if (mode !== 'Museum') {
      useAppStore.getState().setMuseumPresetName(null);
      return;
    }
    const first = presetsRef.current[0]?.name ?? null;
    if (first !== lastPresetNameRef.current) {
      lastPresetNameRef.current = first;
      useAppStore.getState().setMuseumPresetName(first);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'Museum') return undefined;
    const handleInteraction = (): void => {
      if (!pausedRef.current) {
        useAppStore.getState().setMuseumPaused(true);
      }
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        useAppStore.getState().setMuseumPaused(false);
        resumeTimerRef.current = null;
      }, IDLE_TIMEOUT_MS);
    };
    window.addEventListener('pointerdown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };
  }, [mode]);

  useFrame((_, delta) => {
    if (mode !== 'Museum' || pausedRef.current || !controls) return;

    const presets = presetsRef.current;
    if (presets.length === 0) return;

    const dt = Math.min(delta, 0.1);
    timeRef.current += dt;

    let current = presets[indexRef.current];
    let segment = current.dwellSeconds + TRANSITION_SECONDS;

    while (presets.length > 1 && timeRef.current >= segment) {
      timeRef.current -= segment;
      indexRef.current = (indexRef.current + 1) % presets.length;
      current = presets[indexRef.current];
      segment = current.dwellSeconds + TRANSITION_SECONDS;
    }

    if (current.name !== lastPresetNameRef.current) {
      lastPresetNameRef.current = current.name;
      useAppStore.getState().setMuseumPresetName(current.name);
    }

    const nextIndex = (indexRef.current + 1) % presets.length;
    const next = presets[nextIndex];
    const transitionProgress =
      Math.max(0, timeRef.current - current.dwellSeconds) / TRANSITION_SECONDS;
    const t = easeInOutCubic(Math.min(1, Math.max(0, transitionProgress)));

    const position = new THREE.Vector3();
    const target = new THREE.Vector3();
    lerpVector(current.position, next.position, t, position);
    lerpVector(current.target, next.target, t, target);

    camera.position.copy(position);
    controls.target.copy(target);
    controls.update();
  });

  return null;
}
