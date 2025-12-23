import { Platform } from 'react-native';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = 'gpt-4o-mini';

export type GenerateManifestScriptInput = {
  prompt: string;
  durationMin: number;
  voice: string;
  speechRate: number;
};

export type ManifestScriptResult = {
  script: string;
  usedFallback: boolean;
};

const buildPrompt = ({ prompt, voice, speechRate }: GenerateManifestScriptInput) => `You are an award-winning meditation writer creating a bespoke manifestation journey for the Unscroller reset feature.

Your task:
- Speak directly to the listener using second-person voice ("you").
- Craft an immersive, cinematic visualization that lasts about 5 minutes when read aloud at speech rate ${speechRate}. Target 600-650 words (~130 words per minute).
- Make it sensory-rich: weave in sight, sound, touch, scent, and emotional cues tied to the listener's intention.
- Include gentle breath prompts and pacing cues such as "inhale slowly" or "notice the expansion" without sounding clinical.
- Keep the tone grounded, reassuring, and modern. Avoid medical claims or mystical jargon.
- Reference the listener's intention verbatim and evolve it through the story so they can vividly imagine it unfolding.
- Structure the journey with 6 to 8 short paragraphs separated by blank lines:
  1. Arrival & settling breath
  2. Setting the environment and mood
  3. Embodying the desired state from the prompt
  4. Deepening with sensory anchors and supportive imagery
  5. A mini milestone or symbolic moment of transformation
  6. Integration and gentle re-entry, closing with an affirmation related to the prompt
- Each paragraph should be 2-4 sentences for comfortable narration.
- Close with a present-tense affirmation that directly reinforces the listener's intention and a cue to carry that energy into their day.
- Voice reference vibe: ${voice}.

Listener intention prompt:
${prompt}
`;

const fallbackTemplate = ({ prompt }: GenerateManifestScriptInput): string => {
  const arrival = `Settle into a supported seat and let gravity hold you. Unclench your jaw, soften your belly, and send one long breath down to the base of your spine. Inhale slowly through your nose for a count of four, feeling cool air widen your ribs, and pause briefly at the top. Exhale just as slowly, letting your shoulders cascade down, releasing every residual ripple of stress. With each cycle, picture a calm tide drawing out any noise from the day and leaving the shore of your mind smooth, clear, and ready for new impressions.`;
  const environment = `As the breath steadies, imagine a warm dusk horizon spreading before you. You are standing on a terrace that overlooks a sunlit city humming with possibility. The sky is gradiented lavender and copper, and the air carries the gentle scent of citrus trees. Far below, you can hear the softened echo of music and conversation, a reminder that life is moving forward in harmony. In this elevated perch, every breeze feels like a subtle affirmation that you are in the perfect vantage point to welcome what you are creating.`;
  const embodiment = `Bring the intention of ${prompt} directly into focus. See it first as a luminous thread weaving through the center of your chest, pulsing in rhythm with your heartbeat. Inhale and feel that thread thicken into a steady beam of light radiating outward, touching your posture, your expression, your tone of voice. Watch how people around you respond with recognition and ease because they can sense your grounded certainty. Taste the sweetness of this reality, a reassurance that the future you are rehearsing already lives inside your present breath.`;
  const sensory = `Let the scene sharpen with all five senses. Feel the textured railing beneath your fingertips as you rest your hands on the terrace edge, its metal warmed by the sun. Hear the distant chords of a favorite melody floating up from the street, guiding your pace like a personal soundtrack. Notice how the twilight light paints your surroundings in gold, illuminating every detail connected to ${prompt}: documents signed, doors opening, faces smiling. The air has the gentle hush that arrives when everything clicks into place, and you inhale that certainty like a calming, fragrant breeze.`;
  const milestone = `A small but profound shift now unfolds. Perhaps you receive a message that confirms progress, or someone meaningful steps into the scene with genuine delight in their eyes. They mirror back the confidence you are radiating, and together you celebrate a tangible milestone linked to ${prompt}. Feel warmth spiral up your spine, expanding into your shoulders and down your arms, as if the universe itself is nodding in approval. Anchor that sensation by placing one hand over your heart and one over your abdomen, syncing your inhale with their reassuring presence.`;
  const integration = `Hold this tableau for three more breaths. On each inhale, silently affirm, "I am living this intention now." On each exhale, release any remaining doubt into the evening sky, watching it dissolve into sparks of light. When you are ready, step back from the railing and turn toward the doorway leading into your next action, knowing you carry this resonance with you. Whisper, "I walk with the energy of ${prompt} in every choice," and feel that affirmation seal itself in your muscles, your mind, and your memories. Let your eyes open slowly, bringing the same grounded certainty into the room around you.`;
  return [arrival, environment, embodiment, sensory, milestone, integration].join('\n\n');
};

export async function generateManifestScript(input: GenerateManifestScriptInput): Promise<ManifestScriptResult> {
  if (!OPENAI_API_KEY) {
    return { script: fallbackTemplate(input), usedFallback: true };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: buildPrompt(input),
        max_output_tokens: 1100,
        temperature: 0.8,
        metadata: {
          feature: 'reset-manifest',
          platform: Platform.OS,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI error ${response.status}`);
    }

    const data = await response.json();
    const script: string | undefined = data.output?.[0]?.content?.[0]?.text ?? data.output?.[0]?.content ?? data.choices?.[0]?.message?.content;

    if (!script || typeof script !== 'string') {
      throw new Error('Malformed OpenAI response');
    }

    return {
      script: script.trim(),
      usedFallback: false,
    };
  } catch (error) {
    console.warn('[ManifestScriptService] Falling back to template', error);
    return {
      script: fallbackTemplate(input),
      usedFallback: true,
    };
  }
}
