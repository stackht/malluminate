// Fuzzy systems for the mall. The inference engine itself is in fuzzy.js (Mamdani: min / max / centroid).
import { leftShoulder, rightShoulder, tri } from './fuzzy.js'

// PS 6: air conditioning. Inputs: indoor temperature and crowd size. Output: cooling power.
export const AC_SYSTEM = {
  inputs: {
    temperature: { label: 'Indoor temperature', unit: '°C', range: [16, 36], sets: { cold: leftShoulder(19, 23), comfortable: tri(20, 24, 28), warm: tri(25, 29, 33), hot: rightShoulder(30, 34) } },
    crowd: { label: 'Crowd in the zone', unit: '% full', range: [0, 100], sets: { low: leftShoulder(10, 35), medium: tri(25, 50, 75), high: rightShoulder(60, 85) } },
  },
  output: { label: 'Cooling power', unit: '%', range: [0, 100], sets: { off: leftShoulder(5, 20), low: tri(10, 30, 50), medium: tri(40, 60, 80), high: rightShoulder(70, 90) } },
  rules: [
    { if: { temperature: 'cold', crowd: 'low' }, then: 'off' },
    { if: { temperature: 'cold', crowd: 'medium' }, then: 'off' },
    { if: { temperature: 'cold', crowd: 'high' }, then: 'off' },
    { if: { temperature: 'comfortable', crowd: 'low' }, then: 'low' },
    { if: { temperature: 'comfortable', crowd: 'medium' }, then: 'low' },
    { if: { temperature: 'comfortable', crowd: 'high' }, then: 'medium' },
    { if: { temperature: 'warm', crowd: 'low' }, then: 'medium' },
    { if: { temperature: 'warm', crowd: 'medium' }, then: 'medium' },
    { if: { temperature: 'warm', crowd: 'high' }, then: 'high' },
    { if: { temperature: 'hot', crowd: 'low' }, then: 'high' },
    { if: { temperature: 'hot', crowd: 'medium' }, then: 'high' },
    { if: { temperature: 'hot', crowd: 'high' }, then: 'high' },
  ],
}

// PS 7: lighting. Inputs: ambient light (daylight through skylights) and customer activity.
export const LIGHT_SYSTEM = {
  inputs: {
    ambient: { label: 'Ambient light', unit: '%', range: [0, 100], sets: { dark: leftShoulder(10, 35), dim: tri(20, 45, 70), bright: rightShoulder(55, 80) } },
    activity: { label: 'Customer activity', unit: '% full', range: [0, 100], sets: { none: leftShoulder(5, 25), some: tri(15, 45, 75), busy: rightShoulder(60, 85) } },
  },
  output: { label: 'Brightness', unit: '%', range: [0, 100], sets: { off: leftShoulder(5, 20), low: tri(10, 30, 50), medium: tri(40, 60, 80), high: rightShoulder(70, 90) } },
  rules: [
    { if: { ambient: 'bright', activity: 'none' }, then: 'off' },
    { if: { ambient: 'bright', activity: 'some' }, then: 'low' },
    { if: { ambient: 'bright', activity: 'busy' }, then: 'low' },
    { if: { ambient: 'dim', activity: 'none' }, then: 'low' },
    { if: { ambient: 'dim', activity: 'some' }, then: 'medium' },
    { if: { ambient: 'dim', activity: 'busy' }, then: 'high' },
    { if: { ambient: 'dark', activity: 'none' }, then: 'low' },
    { if: { ambient: 'dark', activity: 'some' }, then: 'high' },
    { if: { ambient: 'dark', activity: 'busy' }, then: 'high' },
  ],
}

// Hand-written fuzzy-only crowd estimate (no learning), used to compare with the neural and neuro-fuzzy models.
export const FUZZY_CROWD = {
  inputs: {
    time: { range: [9, 22], sets: { quiet: tri(9, 9, 11.5), lunch: tri(11, 13, 15), afternoon: tri(14, 16, 18), evening: tri(17, 19.5, 22) } },
    day: { range: [0, 6], sets: { weekday: leftShoulder(3, 4.5), weekend: rightShoulder(4, 5) } },
    promo: { range: [0, 1], sets: { none: leftShoulder(0.2, 0.6), running: rightShoulder(0.4, 0.8) } },
  },
  output: { range: [0, 100], sets: { low: leftShoulder(20, 40), medium: tri(30, 52, 72), high: rightShoulder(58, 80) } },
  rules: [
    { if: { time: 'quiet', day: 'weekday', promo: 'none' }, then: 'low' },
    { if: { time: 'quiet', day: 'weekend', promo: 'none' }, then: 'low' },
    { if: { time: 'quiet', day: 'weekday', promo: 'running' }, then: 'low' },
    { if: { time: 'quiet', day: 'weekend', promo: 'running' }, then: 'medium' },
    { if: { time: 'lunch', day: 'weekday', promo: 'none' }, then: 'medium' },
    { if: { time: 'lunch', day: 'weekend', promo: 'none' }, then: 'medium' },
    { if: { time: 'lunch', day: 'weekday', promo: 'running' }, then: 'medium' },
    { if: { time: 'lunch', day: 'weekend', promo: 'running' }, then: 'high' },
    { if: { time: 'afternoon', day: 'weekday', promo: 'none' }, then: 'low' },
    { if: { time: 'afternoon', day: 'weekend', promo: 'none' }, then: 'medium' },
    { if: { time: 'afternoon', day: 'weekday', promo: 'running' }, then: 'medium' },
    { if: { time: 'afternoon', day: 'weekend', promo: 'running' }, then: 'high' },
    { if: { time: 'evening', day: 'weekday', promo: 'none' }, then: 'medium' },
    { if: { time: 'evening', day: 'weekend', promo: 'none' }, then: 'high' },
    { if: { time: 'evening', day: 'weekday', promo: 'running' }, then: 'high' },
    { if: { time: 'evening', day: 'weekend', promo: 'running' }, then: 'high' },
  ],
}
