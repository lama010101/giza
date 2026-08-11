import { useAppStore } from '@/store/app';
import { type ScreenshotFormat, type ScreenshotOptions } from '@/scene/screenshot';

type BooleanOptionKey =
  | 'hideUi'
  | 'transparentBg'
  | 'highRes'
  | 'orthographic'
  | 'scaleBar'
  | 'northArrow'
  | 'citationWatermark';

const BOOLEAN_OPTIONS: { key: BooleanOptionKey; label: string }[] = [
  { key: 'hideUi', label: 'Hide UI' },
  { key: 'transparentBg', label: 'Transparent background' },
  { key: 'highRes', label: 'High resolution' },
  { key: 'orthographic', label: 'Orthographic' },
  { key: 'scaleBar', label: 'Scale bar' },
  { key: 'northArrow', label: 'North arrow' },
  { key: 'citationWatermark', label: 'Citation watermark' },
];

export function ScreenshotPanel(): JSX.Element {
  const options = useAppStore((s) => s.screenshotOptions);
  const setOptions = useAppStore((s) => s.setScreenshotOptions);
  const requestScreenshot = useAppStore((s) => s.requestScreenshot);

  const toggle = (key: BooleanOptionKey): void => {
    const current = options[key];
    setOptions({ [key]: !current } as Partial<ScreenshotOptions>);
  };

  return (
    <div className="screenshot-panel" data-testid="screenshot-panel">
      <h4>Screenshot</h4>
      <div className="screenshot-options">
        {BOOLEAN_OPTIONS.map(({ key, label }) => (
          <label key={key} className="screenshot-option">
            <input type="checkbox" checked={options[key]} onChange={() => toggle(key)} />
            {label}
          </label>
        ))}
      </div>
      <div className="screenshot-format">
        <label>
          Format
          <select
            value={options.format}
            onChange={(e) => setOptions({ format: e.target.value as ScreenshotFormat })}
          >
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </label>
      </div>
      <div className="side-btn-group">
        <button type="button" onClick={requestScreenshot}>
          Capture
        </button>
      </div>
    </div>
  );
}
