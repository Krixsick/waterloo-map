// Official building schedules reviewed September 6, 2026. Do not substitute service/office hours.
const weekdays = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const week = (hours: string) => Object.fromEntries(weekdays.map(day => [day,hours]));
export const buildingAccess: Record<string, {hours: Record<string,string>; note: string; source: string}> = {
  slc: {hours: {...week('Open 24 hours'), Saturday:'Open 24 hours', Sunday:'Open 24 hours'}, note:'Building open 24/7, year-round. Individual businesses keep separate hours.', source:'https://uwaterloo.ca/student-life-centre/'},
  tc: {hours: week('8:30AM - 9:00PM'), note:'Regular weekday building hours. Extended to 11:00PM from one week before exams through the last exam day. Weekend hours are not published.', source:'https://uwaterloo.ca/co-operative-education/contact-us/tc-room-use-principles'},
  grebel: {hours: {...week('8:00AM - 10:00PM'), Friday:'8:00AM - 6:00PM',Saturday:'Closed',Sunday:'Closed'}, note:'Public building hours; residence and library access have separate arrangements.', source:'https://uwaterloo.ca/grebel/contact-us'},
};
