export default function StudyStreakComponent({ streak }: { streak: StudyStreak }) {
  return (
    <div className="p-6 rounded-2xl shadow-md bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
        🔥 Study Streak
      </h2>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-white/10 rounded-xl">
          <p className="text-3xl font-extrabold">{streak.currentStreak}</p>
          <p className="text-sm opacity-90">Current Streak</p>
        </div>
        <div className="p-4 bg-white/10 rounded-xl">
          <p className="text-3xl font-extrabold">{streak.bestStreak}</p>
          <p className="text-sm opacity-90">Best Streak</p>
        </div>
        <div className="p-4 bg-white/10 rounded-xl">
          <p className="text-lg font-medium">
            {new Date(streak.lastStudyDate).toLocaleDateString()}
          </p>
          <p className="text-sm opacity-90">Last Studied</p>
        </div>
      </div>
    </div>
  );
}
