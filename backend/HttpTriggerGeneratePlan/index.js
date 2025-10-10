module.exports = async function (context, req) {
  try {
    const { userEmail, subjects, availability } = req.body;

    if (!userEmail || !subjects || !availability) {
      context.res = { status: 400, body: { error: "Missing required fields" } };
      return;
    }

    // Helper: generate sessions for a subject
    const generateSessions = (subject) => {
      const sessions = [];
      const [year, month, day] = subject.examDate.split("-").map(Number);
      const examDate = new Date(year, month - 1, day);
      const today = new Date();
      let currentDate = new Date(today);

      while (currentDate <= examDate) {
        const dayOfWeek = currentDate.getDay(); // 0=Sun,6=Sat
        const isException = availability.exceptions.includes(
          currentDate.toISOString().split("T")[0]
        );

        if (!isException) {
          const hoursAvailable = (dayOfWeek === 0 || dayOfWeek === 6)
            ? availability.weekends
            : availability.weekdays;

          if (hoursAvailable > 0) {
            // Split into 1.25h sessions (75 min)
            const numSessions = Math.floor(hoursAvailable / 1.25);
            for (let i = 0; i < numSessions; i++) {
              const startHour = 8 + i * 1.25; // start at 8 AM
              const startMinutes = Math.floor((startHour % 1) * 60);
              const startTime = `${String(Math.floor(startHour)).padStart(2,'0')}:${String(startMinutes).padStart(2,'0')}`;
              const endTimeHour = Math.floor(startHour + 1.25);
              const endTimeMinutes = Math.floor((startHour + 1.25) % 1 * 60);
              const endTime = `${String(endTimeHour).padStart(2,'0')}:${String(endTimeMinutes).padStart(2,'0')}`;
              sessions.push({
                subject: subject.name,
                topic: `Study ${subject.name} material`,
                time: `${startTime}-${endTime}`,
                date: currentDate.toISOString().split("T")[0],
                priority: subject.priority
              });
            }
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return sessions;
    };

    // Generate plan for all subjects
    let allSessions = [];
    for (let subj of subjects) {
      const sessions = generateSessions(subj);
      allSessions = allSessions.concat(sessions);
    }

    // Optional: sort sessions by date and time
    allSessions.sort((a, b) => {
      if (a.date === b.date) return a.time.localeCompare(b.time);
      return a.date.localeCompare(b.date);
    });

    context.res = {
      status: 200,
      body: { 
        message: "AI Study Plan generated successfully",
        plan: allSessions 
      }
    };
  } catch (err) {
    context.log.error("Plan generation error:", err);
    context.res = { status: 500, body: { error: "Server error", details: err.message } };
  }
};
