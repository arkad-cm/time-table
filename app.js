const fs = require("fs")

/* Initializations and Global Declarations */

const classWise = {}
const teachers = []
const classNames = []
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]
const slots = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
]

const daySlots = new Set()

for (const d of days) {
  for (const s of slots) {
    daySlots.add(d + " " + s)
  }
}

/* ------------------------- Main Part ------------------------- */

// Part - 1A > Parse CSV Files
parseFiles("./files")
console.log("Parsed CSV Files")

// Part - 1B > Save class wise timetable
saveReportAsCSV("./output")
console.log("Saved Class wise Timetable in ./output dir")

// Part - 2 > Generate new timetable where no teachers are idle
generateNewTimeTable("./new")
console.log("Saved New Timetable in ./new dir")

// Part - 3 > Identify empty slots and find minimum teachers needed
const freeClasses = getEmptyClassSlots()
console.log("Free class slots identified:", freeClasses)
const minTeachers = getMinTeachersNeeded(freeClasses)
console.log("Minimum Teachers needed = " + minTeachers)

/* ---------------------- End of Main Part ---------------------- */


/* ----------------------- Utility methods ---------------------- */

function getMinTeachersNeeded(freeClasses) {
  return Object.keys(freeClasses).reduce((acc, k) => Math.max(acc, freeClasses[k]), 0)
}

function getEmptyClassSlots() {
  const freeSlots = {}

  for (const cName of Object.keys(classWise)) {
    for (const day of Object.keys(classWise[cName])) {
      for (const slot of Object.keys(classWise[cName][day])) {
        if (classWise[cName][day][slot] === "") {
          if (!freeSlots[day + " " + slot]) {
            freeSlots[day + " " + slot] = 1
          } else {
            freeSlots[day + " " + slot] += 1
          }
        }
      }
    }
  }
  return freeSlots
}

function generateNewTimeTable(dirName) {
  for (const tName of teachers) {
    const freeSlots = getEmptySlots(tName)
    assignToEmptySlots(freeSlots, tName)
  }
  saveReportAsCSV(dirName)
}

function assignToEmptySlots(freeSlots, tName) {
  for (const free of freeSlots) {
    let [day, slot, ampm] = free.split(" ")
    slot += " " + ampm
    let assigned = false
    for (const cName of classNames) {
      if (!classWise[cName][day][slot]) {
        classWise[cName][day][slot] = tName
        assigned = true
        break
      }
    }
    if (!assigned) {
      saveReportAsCSV("./error")
      throw new Error(
        "Teacher " +
          tName +
          " could not be assigned to slot " +
          (day + " " + slot) +
          " since all of the classes are busy",
      )
    }
  }
}

function getEmptySlots(tName) {
  const freeSlots = new Set(daySlots)
  for (const cName of Object.keys(classWise)) {
    for (const day of Object.keys(classWise[cName])) {
      for (const slot of Object.keys(classWise[cName][day])) {
        if (classWise[cName][day][slot] === tName)
          freeSlots.delete(day + " " + slot)
      }
    }
  }
  return freeSlots
}

function parseTeacherDetails(tName, data, weekNames, timeSlots) {
  for (let i = 1; i < data.length; i++) {
    for (let j = 1; j < data[i].length; j++) {
      let className = data[i][j].trim()
      if (!className) {
        continue
      }
      if (!classWise[className]) {
        classWise[className] = {}
      }
      if (!classWise[className][weekNames[j]]) {
        classWise[className][weekNames[j]] = {}
      }
      classWise[className][weekNames[j]][timeSlots[i]] = tName
    }
  }
}

function parseFiles(inputDir) {
  for (const path of fs.readdirSync(inputDir)) {
    const tName = path.substring(0, path.indexOf("."))
    teachers.push(tName)
    let content = fs.readFileSync(inputDir + "/" + path).toString()
    let data = content.split("\n").map(it => it.split(","))
    const weekNames = data[0].map(it => it.trim())
    const timeSlots = data.reduce((acc, curr) => {
      acc.push(curr[0])
      return acc
    }, [])
    parseTeacherDetails(tName, data, weekNames, timeSlots)
  }
}

function getClassDetails(cName) {
  let text = "--,"
  const data = classWise[cName]

  for (const d of slots) {
    text += d + ","
  }
  text += "\n"

  for (let i = 0; i < days.length; i++) {
    for (let j = 0; j < slots.length; j++) {
      if (j === 0) {
        text += days[i] + ","
      }
      text += data[days[i]][slots[j]] ?? ""
      text += ","
    }
    text += "\n"
  }

  return text
}

function saveReportAsCSV(outputDir) {
  for (const cName of Object.keys(classWise)) {
    classNames.push(cName)
    let text = ""

    text += getClassDetails(cName) + "\n"

    fs.writeFileSync(outputDir + "/" + cName + ".csv", text)
  }
}

/* -------------------- End of Utility methods -------------------- */
