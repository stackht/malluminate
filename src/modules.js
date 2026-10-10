// The ten source problem statements. PS 1 is the whole system (the dashboard); PS 2-10 are features
// that also have a full page of their own.
export const FEATURES = [
  { id: 'prolog', label: 'Prolog lab', icon: 'rules', ps: [2], tech: 'Prolog (logic programming)', does: 'Write and run Prolog facts, rules and queries about the mall.' },
  { id: 'navigator', label: 'Mall navigator', icon: 'route', ps: [3], tech: 'BFS and DFS', does: 'Find a walking route from the entrance to any store.' },
  { id: 'robot', label: 'Robot pathfinder', icon: 'robot', ps: [4], tech: 'A* on a 3 × 3 grid', does: 'Guide a delivery robot around obstacles to its goal.' },
  { id: 'game', label: 'Store game', icon: 'store', ps: [5], tech: 'Minimax', does: 'Pick which store to feature against a rival mall.' },
  { id: 'climate', label: 'Climate control', icon: 'snow', ps: [6], tech: 'Fuzzy controller', does: 'Set air-conditioning power from temperature and crowd.' },
  { id: 'lighting', label: 'Smart lighting', icon: 'bulb', ps: [7], tech: 'Fuzzy inference', does: 'Set lighting from daylight and customer activity.' },
  { id: 'crowd', label: 'Crowd forecast', icon: 'brain', ps: [8], tech: 'Neuro-fuzzy (ANFIS)', does: 'Predict low, medium or high crowd from time, day and promotions.' },
  { id: 'customers', label: 'Customer insight', icon: 'users', ps: [9], tech: 'Perceptron + competitive learning', does: 'Classify customers and discover shopping groups.' },
  { id: 'assistant', label: 'Mall assistant', icon: 'chat', ps: [10], tech: 'Bigram and trigram language models', does: 'Write short messages about stores, offers and services.' },
]

export const SOURCE_PS = [
  { n: 1, text: 'AI-based shopping mall navigation system (the whole system)', where: 'home', label: 'Command centre dashboard' },
  { n: 2, text: 'Basics of Prolog: write, execute and understand simple AI programs', where: 'prolog', label: 'Prolog lab' },
  { n: 3, text: 'Mall navigation using BFS and DFS: entrance to the clothing store', where: 'navigator', label: 'Mall navigator' },
  { n: 4, text: 'Robot pathfinding with A* on a 3 × 3 grid with an obstacle', where: 'robot', label: 'Robot pathfinder' },
  { n: 5, text: 'Minimax adversarial search for the store selection game', where: 'game', label: 'Store game' },
  { n: 6, text: 'Fuzzy logic controller for air conditioning', where: 'climate', label: 'Climate control' },
  { n: 7, text: 'Fuzzy lighting control from ambient light and customer activity', where: 'lighting', label: 'Smart lighting' },
  { n: 8, text: 'Neuro-fuzzy crowd prediction: low, medium or high', where: 'crowd', label: 'Crowd forecast' },
  { n: 9, text: 'Perceptron customer categories and competitive-learning shopping groups', where: 'customers', label: 'Customer insight' },
  { n: 10, text: 'Bigram µLM and trigram SLM for shopping messages', where: 'assistant', label: 'Mall assistant' },
]

export const featureOf = (id) => FEATURES.find((f) => f.id === id)
