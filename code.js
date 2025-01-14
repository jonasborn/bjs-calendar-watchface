var Locale = require("locale");
var Layout = require("Layout");
var Storage = require("Storage");

var NO_EVENTS = "Keine Events";
var NO_FILE = "Datei fehlt";
var LABEL_DATE = "";
var LABEL_TEXT = "";

var layout = new Layout( {
  type:"v", c: [
    {type:"h", c: [
      {id: "time", type:"txt", font:"12x20:2", label:"14:22", width: 70 },
      {id: "date", type:"txt", font:"6x8:2", label:"15.12", width: 75}
    ]},
    {type:"h", c: [
      {id: "date0", type:"txt", font:"6x8", label: LABEL_DATE, height: 35, halign : 0, width:40, valign: 0 },
      { width: 3 },
      { width: 2, height: 35,  bgCol: 1 },
      { width: 3 },
      {id: "text0", type:"txt", font:"6x8", label: LABEL_TEXT, width:120, height: 35, wrap: true, valign: 0 },
    ]},
     {type:"h", c: [
      { fillx : 1,  bgCol: 1  }
    ]},
    {type:"h", c: [
      {id: "date1", type:"txt", font:"6x8", label: LABEL_DATE, height: 35, halign : 0, width:40, valign: 0 },
      { width: 3 },
      { width: 2, height: 35,  bgCol: 1 },
      { width: 3 },
      {id: "text1", type:"txt", font:"6x8", label: LABEL_TEXT, width:120, height: 35, wrap: true, valign: 0 },
    ]},
    {type:"h", c: [
      { fillx : 1,  bgCol: 1  }
    ]},
    {type:"h", c: [
      {id: "date2", type:"txt", font:"6x8", label: LABEL_DATE, height: 35, halign : 0, width:40, valign: 0 },
      { width: 3 },
      { width: 2, height: 35,  bgCol: 1 },
      { width: 3 },
      {id: "text2", type:"txt", font:"6x8", label: LABEL_TEXT, width:120, height: 35, wrap: true, valign: 0 },
    ]},
  ]
});


var warning = true;
var warningMessage = "WTF";

function formatTime(d) {
  return Locale.time(d,1).replace(" ", "0");
}

function formatDate(d) {
  return d.getDate().toString().padStart(2, '0') + "." + (d.getMonth() + 1).toString().padStart(2, '0'); 
}

function formatDay(timestamp, dur) {
    const date = new Date(timestamp * 1000);
    const end = new Date((timestamp + dur) * 1000);
    const today = new Date();
    const timeString = formatTime(date);
    const timeStringEnd = formatTime(end);

    if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth()) {
        return "Heute\n" + timeString + "\n" + timeStringEnd;
    }

    today.setDate(today.getDate() + 1);
    if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth()) {
        return "Morgen\n" + timeString + "\n" + timeStringEnd;
    }

    const dateString = date.getDate().toString().padStart(2, '0') + "." + (date.getMonth() + 1).toString().padStart(2, '0');
    return dateString + "\n" + timeString + "\n" + timeStringEnd;
}

const originalWriteJSON = require("Storage").writeJSON;
require("Storage").writeJSON = function(filename, data) {
  console.log("File written " + filename);
  var out = originalWriteJSON(filename, data);
  if (filename == "android.calendar.json") {
    console.log("Calendar written " + filename);
    Bangle.beep();
    cal = Storage.readJSON("android.calendar.json",true);
    prepare();
  }
  return out;
};


var cal = Storage.readJSON("android.calendar.json",true);

function updateSingle(field, newval) {
  if (layout[field].label != newval) {
    var e = layout[field];
    g.clearRect(e.x, e.y +1, e.x + e.w, e.y + e.h -2);
    e.label = newval;
    layout.render(e);
  }
}

function updatePair(id, val1, val2) {
    updateSingle("date" + id, val1);
    updateSingle("text" + id, val2);
}

let lastCallTime = 0;
var nextUpdate = "";

function prepare() {
  const currentTime = Date.now();
  if (currentTime - lastCallTime < 5 * 60 * 1000) {
    nextUpdate = new Date(currentTime + 5 * 60 * 1000).toString().substring(0, 21);
    console.log("Too short updates, scheduling at " + nextUpdate);
    return;
  } else {
     console.log("Updating cal"); 
  }
  lastCallTime = currentTime;
  
  if (cal === undefined) {
    warning = true;
    updatePair(0, Locale.time(new Date(), 1), NO_FILE);
    updatePair(1, "", NO_FILE);
    updatePair(2, "", NO_FILE);
    return;
  }
  if (!Array.isArray(cal) || cal.length === 0) {
      warning = true;
        updatePair(0, Locale.time(new Date(), 1), NO_EVENTS);
        updatePair(1, "", NO_EVENTS);
        updatePair(2, "", NO_EVENTS);
      return;
  }
  warning = false;
  
  var now = new Date();
  cal = cal.filter(ev=>ev.timestamp + ev.durationInSeconds > now/1000);
  cal=cal.sort((a,b)=>a.timestamp - b.timestamp);
  
  var len = cal.length; 
  
  if (len > 0) {
    var first = cal[0];
    var end = new Date((first.timestamp + first.durationInSeconds) * 1000);
    nextUpdate = end.toString().substring(0, 21);
  }
  
  if (len > 2) {
    updatePair(2, formatDay(cal[2].timestamp, cal[2].durationInSeconds), cal[2].title);
  } else {
    updatePair(2, "", "");
  }
  
  if (len > 1) {
    updatePair(1, formatDay(cal[1].timestamp, cal[1].durationInSeconds), cal[1].title);
  } else {
     updatePair(1, "", "");
  }
  
  if (len > 0) {
    updatePair(0, formatDay(cal[0].timestamp, cal[0].durationInSeconds), cal[0].title);
  } else {
     updatePair(0, "", "");
  }
  
}

function drawTime() {
  var d = new Date();
  
  var timeStr = formatTime(d);
  layout.clear(layout.time);
  layout.time.label = timeStr;
  layout.render(layout.time);
  
  var dateStr = formatDate(d);
  if (layout.date.label != dateStr) {
    layout.clear(layout.date);
    layout.date.label = dateStr;
    layout.render(layout.date);
  }
  
  if (d.toString().substring(0, 21) == nextUpdate) {
     prepare(); 
  }
  
  queueDraw();  
}

var drawTimeout;

function queueDraw() {
  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = setTimeout(function() {
    drawTimeout = undefined;
    drawTime();
  }, 60000 - (Date.now() % 60000));
}

g.clear();
Bangle.loadWidgets();
Bangle.drawWidgets();
layout.render();

drawTime();

prepare(2);
Bangle.setUI("clock");

