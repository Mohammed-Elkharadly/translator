import type { ModelProgress, ModelState } from "../types";

interface Props {
  state: ModelState;
  progress: ModelProgress | null;
  onLoad: () => void;
}

export default function ModelStatus({ state, progress, onLoad }: Props) {
  const percent = Math.max(0, Math.min(100, progress?.progress ?? 0));

  return (

    <div className="model-status">
      <div className="model-status-top">
        <span className={`status-dot ${state}`} />
        <div className="model-status-copy">
          <strong>
            {state === "ready" ? "Translation model ready" :
             state === "loading" ? "Preparing translation model" :
             state === "error" ? "Model loading failed" : "Translation model"}
          </strong>
          <span>
            {state === "ready" ? "Runs locally on this device" :
             state === "loading" ? progress?.status ?? "Loading model files…" :
             "Download the model to start translating"}
          </span>
        </div>
        {state !== "ready" && state !== "loading" && (
          <button className="button button-small" onClick={onLoad}>
            Load model
          </button>
        )}
      </div>

      {state === "loading" && (
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
    
  );
}
