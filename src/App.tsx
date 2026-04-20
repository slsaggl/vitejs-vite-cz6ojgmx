import { useMemo, useState } from 'react';

type HabitKey = 'water' | 'fruit' | 'exercise' | 'sleep' | 'stretch';

type RecordItem = {
  date: string;
  condition: string;
  morningTask: string;
  habits: Record<HabitKey, boolean>;
  mealMemo: string;
  exerciseMemo: string;
  weight: string;
  note: string;
};

const HABITS: { key: HabitKey; label: string; points: number }[] = [
  { key: 'water', label: '물', points: 1 },
  { key: 'fruit', label: '과일', points: 1 },
  { key: 'exercise', label: '운동', points: 2 },
  { key: 'sleep', label: '수면', points: 2 },
  { key: 'stretch', label: '스트레칭', points: 1 },
];

const initialData: RecordItem[] = [
  {
    date: '2026-04-18',
    condition: '보통',
    morningTask: '저녁 약속',
    habits: {
      water: true,
      fruit: true,
      exercise: false,
      sleep: true,
      stretch: false,
    },
    mealMemo: '아침 과일, 점심 일반식, 저녁 가볍게',
    exerciseMemo: '산책 30분',
    weight: '',
    note: '무난한 하루',
  },
  {
    date: '2026-04-19',
    condition: '좋음',
    morningTask: '저녁 운동 예정',
    habits: {
      water: true,
      fruit: true,
      exercise: true,
      sleep: true,
      stretch: true,
    },
    mealMemo: '과식 없음',
    exerciseMemo: '유산소 40분',
    weight: '',
    note: '몸이 가벼움',
  },
];

function calcScore(habits: Record<HabitKey, boolean>) {
  return HABITS.reduce(
    (sum, habit) => sum + (habits[habit.key] ? habit.points : 0),
    0
  );
}

function formatDate(date: string) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(d);
}

function getConditionColor(condition: string) {
  if (condition === '좋음') return '#dcfce7';
  if (condition === '보통') return '#fef3c7';
  if (condition === '나쁨') return '#fee2e2';
  return '#e5e7eb';
}

export default function App() {
  const today = new Date().toISOString().slice(0, 10);

  const [records, setRecords] = useState<RecordItem[]>(
    [...initialData].sort((a, b) => (a.date < b.date ? 1 : -1))
  );

  const existingToday = records.find((r) => r.date === today);

  const emptyHabits: Record<HabitKey, boolean> = {
    water: false,
    fruit: false,
    exercise: false,
    sleep: false,
    stretch: false,
  };

  const [form, setForm] = useState<RecordItem>(
    existingToday || {
      date: today,
      condition: '보통',
      morningTask: '',
      habits: emptyHabits,
      mealMemo: '',
      exerciseMemo: '',
      weight: '',
      note: '',
    }
  );

  const score = useMemo(() => calcScore(form.habits), [form.habits]);
  const maxScore = HABITS.reduce((sum, h) => sum + h.points, 0);
  const scorePercent = Math.round((score / maxScore) * 100);

  const stats = useMemo(() => {
    const total = records.length;
    const avg = total
      ? Math.round(
          records.reduce((sum, r) => sum + calcScore(r.habits), 0) / total
        )
      : 0;
    const perfectDays = records.filter(
      (r) => calcScore(r.habits) === maxScore
    ).length;

    const sortedAsc = [...records].sort((a, b) => (a.date > b.date ? 1 : -1));
    let streak = 0;
    for (let i = sortedAsc.length - 1; i >= 0; i--) {
      const rec = sortedAsc[i];
      if (calcScore(rec.habits) >= 5) streak += 1;
      else break;
    }

    return { total, avg, perfectDays, streak };
  }, [records, maxScore]);

  const sendToSheet = async () => {
    await fetch(
      'https://script.google.com/macros/s/AKfycbww3HvqFUjA2B8pC4v-5fW8fB2mzltjqTRzd430VP40q5UDmEuzJq_iMBZgEhd0hFFPZw/exec',
      {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          date: form.date,
          condition: form.condition,
          score: score,
          water: form.habits.water,
          fruit: form.habits.fruit,
          exercise: form.habits.exercise,
          sleep: form.habits.sleep,
          stretch: form.habits.stretch,
          meal: form.mealMemo,
          exerciseMemo: form.exerciseMemo,
          weight: form.weight,
          note: form.note,
        }),
      }
    );
  };

  const saveRecord = async () => {
    try {
      setRecords((prev) => {
        const filtered = prev.filter((r) => r.date !== form.date);
        return [{ ...form }, ...filtered].sort((a, b) =>
          a.date < b.date ? 1 : -1
        );
      });

      await sendToSheet();
      alert('구글시트 저장 완료');
    } catch (error) {
      console.error(error);
      alert('시트 저장 중 오류 발생');
    }
  };

  const resetToday = () => {
    setForm({
      date: today,
      condition: '보통',
      morningTask: '',
      habits: { ...emptyHabits },
      mealMemo: '',
      exerciseMemo: '',
      weight: '',
      note: '',
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '24px',
        fontFamily: 'Arial, sans-serif',
        color: '#0f172a',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '24px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          }}
        >
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
            몸 데이터 관리 시스템
          </h1>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            하루 상태, 습관, 식단, 운동을 한 화면에서 기록
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <div>
              <label>날짜</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label>몸상태</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {['좋음', '보통', '나쁨'].map((state) => (
                  <button
                    key={state}
                    onClick={() => setForm({ ...form, condition: state })}
                    style={{
                      ...buttonStyle,
                      background: form.condition === state ? '#0f172a' : '#fff',
                      color: form.condition === state ? '#fff' : '#0f172a',
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label>아침 1과업</label>
            <input
              value={form.morningTask}
              onChange={(e) =>
                setForm({ ...form, morningTask: e.target.value })
              }
              placeholder="예: 저녁 운동 예정, 회식 조심"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <label>오늘 습관 체크</label>
              <strong>
                {score}점 / {maxScore}점
              </strong>
            </div>

            <div
              style={{
                width: '100%',
                height: '12px',
                background: '#e2e8f0',
                borderRadius: '999px',
                overflow: 'hidden',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: `${scorePercent}%`,
                  height: '100%',
                  background: '#0f172a',
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
              }}
            >
              {HABITS.map((habit) => {
                const checked = form.habits[habit.key];
                return (
                  <button
                    key={habit.key}
                    onClick={() =>
                      setForm({
                        ...form,
                        habits: {
                          ...form.habits,
                          [habit.key]: !checked,
                        },
                      })
                    }
                    style={{
                      padding: '16px',
                      borderRadius: '18px',
                      border: '1px solid #cbd5e1',
                      background: checked ? '#0f172a' : '#fff',
                      color: checked ? '#fff' : '#0f172a',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{habit.label}</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      {habit.points}점
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <div>
              <label>식단 메모</label>
              <textarea
                value={form.mealMemo}
                onChange={(e) => setForm({ ...form, mealMemo: e.target.value })}
                style={textareaStyle}
              />
            </div>
            <div>
              <label>운동 메모</label>
              <textarea
                value={form.exerciseMemo}
                onChange={(e) =>
                  setForm({ ...form, exerciseMemo: e.target.value })
                }
                style={textareaStyle}
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '180px 1fr',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div>
              <label>체중</label>
              <input
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="예: 52.4"
                style={inputStyle}
              />
            </div>
            <div>
              <label>하루 메모</label>
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="예: 오후에 붓기 심함"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={saveRecord}
              style={{ ...buttonStyle, background: '#0f172a', color: '#fff' }}
            >
              저장하기
            </button>
            <button
              onClick={resetToday}
              style={{
                ...buttonStyle,
                background: '#fff',
                border: '1px solid #cbd5e1',
              }}
            >
              오늘 폼 초기화
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            }}
          >
            <h2 style={{ marginBottom: '16px' }}>요약 대시보드</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <div style={statBoxStyle}>
                <div style={statTitleStyle}>연속 성공</div>
                <div style={statValueStyle}>{stats.streak}일</div>
              </div>
              <div style={statBoxStyle}>
                <div style={statTitleStyle}>평균 점수</div>
                <div style={statValueStyle}>{stats.avg}점</div>
              </div>
              <div style={statBoxStyle}>
                <div style={statTitleStyle}>기록 일수</div>
                <div style={statValueStyle}>{stats.total}일</div>
              </div>
              <div style={statBoxStyle}>
                <div style={statTitleStyle}>만점 일수</div>
                <div style={statValueStyle}>{stats.perfectDays}일</div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            }}
          >
            <h2 style={{ marginBottom: '16px' }}>최근 기록</h2>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {records.map((record) => {
                const recordScore = calcScore(record.habits);
                return (
                  <button
                    key={record.date}
                    onClick={() => selectRecord(record)}
                    style={{
                      padding: '16px',
                      borderRadius: '18px',
                      border: '1px solid #e2e8f0',
                      background: '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <strong>{formatDate(record.date)}</strong>
                      <span style={{ color: '#64748b' }}>불러오기</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '8px',
                      }}
                    >
                      <span
                        style={{
                          background: getConditionColor(record.condition),
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                        }}
                      >
                        {record.condition}
                      </span>
                      <span
                        style={{
                          background: '#f1f5f9',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                        }}
                      >
                        {recordScore}점
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#475569' }}>
                      {record.note || '메모 없음'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '8px',
  padding: '12px 14px',
  borderRadius: '14px',
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '120px',
  marginTop: '8px',
  padding: '12px 14px',
  borderRadius: '14px',
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box',
  resize: 'vertical',
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 18px',
  borderRadius: '14px',
  cursor: 'pointer',
  fontWeight: 700,
};

const statBoxStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '18px',
  padding: '16px',
};

const statTitleStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '14px',
  marginBottom: '8px',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 800,
};
