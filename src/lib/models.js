// Models trained once at first use and shared by the dashboard and the module pages.
import { infer } from './fuzzy.js'
import { FUZZY_CROWD } from './systems.js'
import { makeCrowdData, newAnfis, anfisEpoch, anfisPredict, trainMLP } from './crowd.js'
import { makeCustomers, newPerceptron, perceptronEpoch, perceptronPredict, vec, newCompetitive, competitiveEpoch, winnerOf, patVec, describeGroup } from './customers.js'
import { buildModel } from './ngram.js'
import { CORPUS } from './corpus.js'

export const crowdData = makeCrowdData()

let crowd = null
export function crowdModels() {
  if (!crowd) {
    let a = newAnfis()
    for (let i = 0; i < 60; i++) a = anfisEpoch(a, crowdData)
    crowd = { anfis: a, mlp: trainMLP(crowdData) }
  }
  return crowd
}
export function crowdAll(hour, day, promo) {
  const { anfis, mlp } = crowdModels()
  const x = [hour, day, promo]
  const fuzzy = infer(FUZZY_CROWD, { time: hour, day, promo }).crisp
  return { fuzzy, neural: mlp.predict(x), combined: anfisPredict(anfis, x).value }
}

export const customerData = makeCustomers()
let perc = null
export function trainedPerceptron() {
  if (!perc) {
    let p = newPerceptron()
    for (let i = 0; i < 120; i++) {
      const r = perceptronEpoch(p, customerData)
      p = r.model
      if (!r.errors) break
    }
    perc = p
  }
  return perc
}
export const classifyCustomer = (rec) => perceptronPredict(trainedPerceptron(), vec(rec))

let comp = null
export function trainedGroups() {
  if (!comp) {
    let m = newCompetitive(customerData, 4)
    for (let i = 0; i < 30; i++) m = competitiveEpoch(m, customerData, 0.1)
    comp = m
  }
  return comp
}
export const groupOfCustomer = (rec) => winnerOf(trainedGroups().units, patVec(rec))
export const groupInfo = () => trainedGroups().units.map(describeGroup)

let bi = null
let tri = null
export const languageModels = () => ({ bi: (bi ||= buildModel(CORPUS, 2)), tri: (tri ||= buildModel(CORPUS, 3)) })
