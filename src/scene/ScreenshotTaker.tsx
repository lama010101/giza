import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useAppStore } from '@/store/app';

export function ScreenshotTaker(): null {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const screenshotRequest = useAppStore((state) => state.screenshotRequest);
  const clearScreenshotRequest = useAppStore((state) => state.clearScreenshotRequest);

  useEffect(() => {
    if (!screenshotRequest) return;

    gl.render(scene, camera);
    const dataUrl = gl.domElement.toDataURL('image/png');

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `giza-screenshot-${screenshotRequest}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    clearScreenshotRequest();
  }, [screenshotRequest, gl, scene, camera, clearScreenshotRequest]);

  return null;
}
