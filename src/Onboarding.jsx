import { useState } from 'react'
import './Onboarding.css'

const HABITS = [
  'Late-night snacking',
  'Junk food',
  'Skipping meals',
  'Stress eating',
  'Emotional eating',
  'Sugar cravings',
  'Too much caffeine',
  'Alcohol',
  'Smoking',
  'Too much screen time',
  'Sedentary lifestyle',
  'Irregular sleep',
]

const GOALS = [
  'Lose weight',
  'Eat healthier',
  'Sleep better',
  'Reduce stress',
  'Build more energy',
  'Improve focus',
  'Exercise regularly',
  'Drink less alcohol',
  'Quit smoking',
  'Be more mindful',
  'Improve digestion',
  'Boost immunity',
]

const STEPS = ['name', 'location', 'habits', 'goals']


function NameStep({ form, setForm, onEnter }) {
  return (
    <>
      <p className="step-eyebrow">Step 1 of 4</p>
      <h1 className="step-title">
        What should we<br />call you?
      </h1>
      <p className="step-subtitle">
        Let's make this journey feel personal, from day one.
      </p>
      <div className="field">
        <label htmlFor="nm-name">Your first name</label>
        <input
          id="nm-name"
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && onEnter()}
          placeholder="e.g. Alex"
          autoFocus
          autoComplete="given-name"
        />
      </div>
    </>
  )
}

function LocationStep({ form, setForm, onEnter }) {
  return (
    <>
      <p className="step-eyebrow">Step 2 of 4</p>
      <h1 className="step-title">
        Where are<br />you based?
      </h1>
      <p className="step-subtitle">
        We'll tailor seasonal tips and local wellness insights just for you.
      </p>
      <div className="field">
        <label htmlFor="nm-location">Your location</label>
        <input
          id="nm-location"
          type="text"
          value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && onEnter()}
          placeholder="e.g. London, UK"
          autoFocus
          autoComplete="country-name"
        />
      </div>
    </>
  )
}

function HabitsStep({ form, toggleHabit }) {
  const count = form.habits.length
  return (
    <>
      <p className="step-eyebrow">Step 3 of 4</p>
      <h1 className="step-title">
        What would you<br />like to improve?
      </h1>
      <p className="step-subtitle">
        Select any habits you'd like to work on. No judgment here — we've all got a few.
      </p>
      <p className="selection-hint" style={{ opacity: count > 0 ? 1 : 0 }}>
        {count} selected
      </p>
      <div className="chips-grid">
        {HABITS.map(habit => (
          <button
            key={habit}
            type="button"
            className={`chip${form.habits.includes(habit) ? ' selected' : ''}`}
            onClick={() => toggleHabit(habit)}
          >
            {habit}
          </button>
        ))}
      </div>
    </>
  )
}

function GoalsStep({ form, toggleGoal }) {
  const count = form.goals.length
  return (
    <>
      <p className="step-eyebrow">Step 4 of 4</p>
      <h1 className="step-title">
        What does your<br />best self look like?
      </h1>
      <p className="step-subtitle">
        Choose the goals that feel most meaningful to you right now.
      </p>
      <p className="selection-hint" style={{ opacity: count > 0 ? 1 : 0 }}>
        {count} selected
      </p>
      <div className="chips-grid">
        {GOALS.map(goal => (
          <button
            key={goal}
            type="button"
            className={`chip${form.goals.includes(goal) ? ' selected' : ''}`}
            onClick={() => toggleGoal(goal)}
          >
            {goal}
          </button>
        ))}
      </div>
    </>
  )
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    location: '',
    habits: [],
    goals: [],
  })

  const canContinue = () => {
    if (step === 0) return form.name.trim().length > 0
    if (step === 1) return form.location.trim().length > 0
    return true
  }

  const goNext = () => {
    if (!canContinue()) return
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      onComplete(form)
    }
  }

  const goBack = () => setStep(s => s - 1)

  const toggleHabit = habit =>
    setForm(f => ({
      ...f,
      habits: f.habits.includes(habit)
        ? f.habits.filter(h => h !== habit)
        : [...f.habits, habit],
    }))

  const toggleGoal = goal =>
    setForm(f => ({
      ...f,
      goals: f.goals.includes(goal)
        ? f.goals.filter(g => g !== goal)
        : [...f.goals, goal],
    }))

  const isChipStep = step === 2 || step === 3

  return (
    <div className="onboarding">
      <div className="card">
        <div className="logo">
          <div className="nm-logo-sm" aria-hidden="true"><span>NM</span></div>
          <span className="logo-wordmark">NourishMind</span>
        </div>

        <div className="progress" role="progressbar" aria-valuenow={step + 1} aria-valuemax={STEPS.length}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`progress-segment${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}
            />
          ))}
        </div>

        <div key={step} className="step-content">
          {step === 0 && <NameStep form={form} setForm={setForm} onEnter={goNext} />}
          {step === 1 && <LocationStep form={form} setForm={setForm} onEnter={goNext} />}
          {step === 2 && <HabitsStep form={form} toggleHabit={toggleHabit} />}
          {step === 3 && <GoalsStep form={form} toggleGoal={toggleGoal} />}
        </div>

        <div className="nav">
          {step > 0 && (
            <button type="button" className="btn-back" onClick={goBack}>
              ← Back
            </button>
          )}
          <button
            type="button"
            className="btn-primary"
            onClick={goNext}
            disabled={!canContinue()}
          >
            {step === STEPS.length - 1 ? 'Start my journey →' : 'Continue →'}
          </button>
        </div>

        {isChipStep && (
          <div className="skip-link">
            <button type="button" onClick={goNext}>
              Skip this step
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
