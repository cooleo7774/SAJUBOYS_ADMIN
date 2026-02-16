import { useStudio } from "../components/studio/StudioContext";
import type { ToneMannerProfile } from "../types/studio";

export function ToneRoute() {
  const studio = useStudio();

  return (
    <div className="tab-content">
      <div className="toolbar-inline">
        <button type="button" onClick={() => studio.handleApplyTonePreset("soft_guide")}>
          Soft Guide
        </button>
        <button type="button" onClick={() => studio.handleApplyTonePreset("expert_brief")}>
          Expert Brief
        </button>
        <button type="button" onClick={() => studio.handleApplyTonePreset("direct_coach")}>
          Direct Coach
        </button>
      </div>

      <div className="split">
        <label>
          <span>Formality</span>
          <select
            value={studio.toneProfile.formality}
            onChange={(event) =>
              studio.setToneProfile((prev) => ({ ...prev, formality: event.target.value as ToneMannerProfile["formality"] }))
            }
          >
            <option value="casual">casual</option>
            <option value="balanced">balanced</option>
            <option value="formal">formal</option>
          </select>
        </label>
        <label>
          <span>Directness</span>
          <select
            value={studio.toneProfile.directness}
            onChange={(event) =>
              studio.setToneProfile((prev) => ({ ...prev, directness: event.target.value as ToneMannerProfile["directness"] }))
            }
          >
            <option value="soft">soft</option>
            <option value="balanced">balanced</option>
            <option value="direct">direct</option>
          </select>
        </label>
      </div>

      <div className="split">
        <label>
          <span>Empathy</span>
          <select
            value={studio.toneProfile.empathy}
            onChange={(event) =>
              studio.setToneProfile((prev) => ({ ...prev, empathy: event.target.value as ToneMannerProfile["empathy"] }))
            }
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </label>
        <label>
          <span>Detail Level</span>
          <select
            value={studio.toneProfile.detail_level}
            onChange={(event) =>
              studio.setToneProfile((prev) => ({ ...prev, detail_level: event.target.value as ToneMannerProfile["detail_level"] }))
            }
          >
            <option value="brief">brief</option>
            <option value="standard">standard</option>
            <option value="deep">deep</option>
          </select>
        </label>
      </div>

      <div className="split">
        <label>
          <span>Fortune Frame</span>
          <select
            value={studio.toneProfile.fortune_frame}
            onChange={(event) =>
              studio.setToneProfile((prev) => ({ ...prev, fortune_frame: event.target.value as ToneMannerProfile["fortune_frame"] }))
            }
          >
            <option value="probabilistic">probabilistic</option>
            <option value="balanced">balanced</option>
            <option value="intuitive">intuitive</option>
          </select>
        </label>
        <label>
          <span>CTA Style</span>
          <select
            value={studio.toneProfile.cta_style}
            onChange={(event) =>
              studio.setToneProfile((prev) => ({ ...prev, cta_style: event.target.value as ToneMannerProfile["cta_style"] }))
            }
          >
            <option value="single_action">single_action</option>
            <option value="two_options">two_options</option>
            <option value="timeline">timeline</option>
          </select>
        </label>
      </div>

      <label>
        <span>Emoji Policy</span>
        <select
          value={studio.toneProfile.emoji_policy}
          onChange={(event) =>
            studio.setToneProfile((prev) => ({ ...prev, emoji_policy: event.target.value as ToneMannerProfile["emoji_policy"] }))
          }
        >
          <option value="none">none</option>
          <option value="minimal">minimal</option>
          <option value="contextual">contextual</option>
        </select>
      </label>

      <div className="split">
        <label>
          <span>Preferred Phrases (line-separated)</span>
          <textarea
            value={studio.toneProfile.preferred_phrases.join("\n")}
            onChange={(event) =>
              studio.setToneProfile((prev) => ({
                ...prev,
                preferred_phrases: event.target.value
                  .split(/\n/g)
                  .map((item) => item.trim())
                  .filter((item) => item.length > 0)
              }))
            }
          />
        </label>
        <label>
          <span>Banned Phrases (line-separated)</span>
          <textarea
            value={studio.toneProfile.banned_phrases.join("\n")}
            onChange={(event) =>
              studio.setToneProfile((prev) => ({
                ...prev,
                banned_phrases: event.target.value
                  .split(/\n/g)
                  .map((item) => item.trim())
                  .filter((item) => item.length > 0)
              }))
            }
          />
        </label>
      </div>

      <div className="preview-block">
        <h3>Tone Guide Preview</h3>
        <p>{studio.toneGuide}</p>
      </div>
    </div>
  );
}
