@AGENTS.md

# Nutra (GRIT)

Expo / React Native app for calorie and workout tracking, built from a Claude Design
prototype. The UI is in Serbian.

## Working with the user

- Reply in Serbian.
- Commit after each change that has been verified — the user treats commits as
  checkpoints to roll back to, and asks for them explicitly.

## Layout

- `src/screens` — one file per screen; tab screens that own sub-views (profile,
  training) switch between them with local state, since there is no stack navigator.
- `src/components` — shared UI. `src/services` — storage and meal parsing.
- `src/context/AppDataContext` — profile, meals, workouts, selected day.
- `src/theme` — palettes and the themed-styles hook. `src/utils` — calculations, dates.

## Conventions

- Colours come from the theme: `const styles = useThemedStyles(makeStyles)` with
  `makeStyles = (t: Theme) => StyleSheet.create({...})`, using `t.bg`, `t.surface`,
  `t.text`, `t.ink(alpha)`. Accents — mint, lavender, the gradients and the `#101012`
  text that sits on them — are the same in both themes and live in `theme/colors.ts`.
- Dates: `utils/dates.ts`. Use `toDateKey` (local); never `toISOString().slice(0,10)`,
  which is UTC and turns the day over at 01:00/02:00 in Serbia.
- All persistence goes through `services/storage.ts` (AsyncStorage) and is exposed by
  `AppDataContext`, so screens never touch storage directly.
- Meal parsing goes through `services/mealParser.ts`; `.env` picks the provider.
  Errors meant for the user are thrown as `MealParserError` and shown in the chat.

## Verifying

- `npx tsc --noEmit` after changes.
- The web preview is the only way to see the app from here: `.claude/launch.json`
  defines `nutra-expo-web-check` on port 8090. Drive it with the browser tools'
  `javascript_tool` (dispatch pointer events, read computed styles), because the pane
  cannot do gestures — swipes, slider drags — or the native keyboard. Anything
  gesture-based has to be confirmed by the user on the phone.

## Environment

- `.env` holds the Gemini API key and is git-ignored; `.env.example` shows the shape.
  `EXPO_PUBLIC_` variables are inlined into the bundle, so the key ships in the app.
- Free Gemini tier: 5 requests/minute and 20/day — easy to exhaust while testing.
  `EXPO_PUBLIC_MEAL_PARSER_PROVIDER=mock` works offline and without limits.
- The Expo Go build on the App Store tracks one SDK; the project SDK must match it
  (currently 57) or the app refuses to open.
