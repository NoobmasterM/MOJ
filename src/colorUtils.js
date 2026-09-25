export const getDifficultyColor = (difficulty) => {
  const value = String(difficulty ?? '').trim().toUpperCase();

  if (value === 'EASY') return '#198754';
  if (value === 'MEDIUM') return '#ffc107';
  if (value === 'HARD') return '#dc3545';

  return '#6c757d';
};

export const getDifficultyBadgeStyle = (difficulty) => ({
  backgroundColor: getDifficultyColor(difficulty),
  color: '#fff',
  border: 'none'
});

export const getRatingColor = (rating) => {
  const value = Number(rating) || 0;

  if (value <= 400) return '#000000';
  if (value <= 800) return '#198754';
  if (value <= 1200) return '#17a2b8';
  if (value <= 1600) return '#0d6efd';
  if (value <= 2000) return '#6f42c1';
  if (value <= 2400) return '#ffc107';
  return '#dc3545';
};

export const getRatingFill = (rating, explicitFill = undefined) => {
  if (explicitFill !== undefined && explicitFill !== null && explicitFill !== '') {
    return Number(explicitFill);
  }

  const value = Number(rating) || 0;
  if (!value) return 0;
  return Math.min(100, Math.max(20, Math.round(value / 30)));
};

export const getRatingLabel = (rating) => {
  const value = Number(rating) || 0;

  if (value <= 400) return 'Newbie';
  if (value <= 800) return 'Pupil';
  if (value <= 1200) return 'Specialist';
  if (value <= 1600) return 'Expert';
  if (value <= 2000) return 'Candidate Master';
  if (value <= 2400) return 'Master';
  return 'Grandmaster';
};

export const getRatingBadgeStyle = (rating, explicitColor = undefined) => ({
  backgroundColor: explicitColor || getRatingColor(rating),
  color: '#fff',
  border: 'none'
});
