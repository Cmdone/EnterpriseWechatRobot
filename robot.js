/* jshint esversion: 6 */
const schedule = require("node-schedule");

const jobs = [
    require("./jobs/day_collection"),
    require("./jobs/day_off"),
    require("./jobs/day_on"),
    require("./jobs/takeout"),
    require("./jobs/week_report")
];

for (let i = 0; i < jobs.length; i++) {
    let job = jobs[i];
    schedule.scheduleJob(job.rule, job.task);
}
