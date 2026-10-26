/** Lecture de l'horaire d'une halaqa (« السبت والأحد 09:00 - 12:00 »), sans dépendance : testable seule. */
export interface ParsedSchedule {
  activeDays: number[]; // [0, 6] representing Sun, Mon, etc.
  startTime: { hours: number; minutes: number } | null;
  endTime: { hours: number; minutes: number } | null;
}

export const parseClassSchedule = (scheduleStr: string): ParsedSchedule => {
  const arabicDays = [
    { name: "الأحد", index: 0 },
    { name: "الاثنين", index: 1 },
    { name: "الإثنين", index: 1 },
    { name: "الثلاثاء", index: 2 },
    { name: "الأربعاء", index: 3 },
    { name: "الخميس", index: 4 },
    { name: "الجمعة", index: 5 },
    { name: "السبت", index: 6 }
  ];

  const activeDays = Array.from(new Set(
    arabicDays
      .filter(day => scheduleStr.includes(day.name))
      .map(day => day.index)
  ));

  const timeRegex = /(\d{1,2}):(\d{2})/g;
  const matches = [...scheduleStr.matchAll(timeRegex)];
  
  let startTime = null;
  let endTime = null;

  if (matches.length >= 1) {
    startTime = {
      hours: parseInt(matches[0][1], 10),
      minutes: parseInt(matches[0][2], 10)
    };
  }
  if (matches.length >= 2) {
    endTime = {
      hours: parseInt(matches[1][1], 10),
      minutes: parseInt(matches[1][2], 10)
    };
  }

  return { activeDays, startTime, endTime };
};
