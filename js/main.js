"use strict";

const $ = document.querySelectorAll.bind(document);
const $$ = document.querySelector.bind(document);
Element.prototype.on = Element.prototype.addEventListener;

// https://developer.mozilla.org/en/docs/Web/API/NodeList
NodeList.prototype.forEach = Array.prototype.forEach;

const fieldsets = [
  {
    title: "Days of the week",
    type: "checkbox",
    name: "days_of_week",
    data: DAYS_OF_WEEK,
  },
  {
    title: "Status",
    type: "radio",
    name: "activity_select_param",
    data: STATUS,
    def: ["2"],
  },
  {
    title: "Location",
    type: "checkbox",
    name: "center_ids",
    data: ORIGINAL_DATA.centers,
  },
  {
    title: "Age category",
    type: "checkbox",
    name: "activity_other_category_ids",
    data: ORIGINAL_DATA.othercategories,
    def: ["23"],
  },
  {
    title: "Sorty by",
    type: "radio",
    name: "order_by",
    data: ORIGINAL_DATA.sorts.map(item => ({ id: item, desc: item })),
  },
];

const $form = $$("#form");
const $activities = $$("#activities");

const drawInput = function (type, name, def, input) {
  const { id, desc } = input;
  const code = `
      <label for="${name}_${id}">
        <input type="${type}" name="${name}" id="${name}_${id}" value="${id}"${
    def?.includes(id) ? "checked" : ""
  }>${desc}
      </label>
    `;

  return code;
};

const drawFieldset = function (fieldset) {
  const { title, type, name, def, data } = fieldset;

  const code = `
      <fieldset>
        <legend>${title}</legend>
        ${data.map(input => drawInput(type, name, def, input)).join("")}
      </fieldset>
    `;

  return code;
};

const fetchData = async (url, options) => {
  const response = await fetch(url, options);
  const data = await response.json();
  return data;
};

fieldsets.forEach(fieldset => {
  $form.innerHTML += drawFieldset(fieldset);
});

const drawActivities = function (activities) {
  const code = `
      <table>
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Location</th>
            <th>Day</th>
            <th>Time</th>
            <th>Registered spots</th>
            <th>Total spots</th>
            <th>Period</th>
            <th>Registration date</th>
          </tr>
        </thead>
        <tbody>
          ${activities.map(activity => drawActivity(activity)).join("")}
        </tbody>
      </table>
    `;

  return code;
};

const drawActivity = function (activity) {
  const {
    activity_online_start_time,
    already_enrolled,
    name,
    date_range,
    days_of_week,
    location,
    number,
    time_range,
    total_open,
  } = activity;

  const code = `
      <tr>
        <td>${number}</td>
        <td>${name}</td>
        <td>${location.label}</td>
        <td>${days_of_week}</td>
        <td>${time_range}</td>
        <td>${already_enrolled}</td>
        <td>${total_open}</td>
        <td>${date_range}</td>
        <td>${activity_online_start_time}</td>
      </tr>
    `;

  return code;
};

$form.on("submit", async function (event) {
  event.preventDefault();
  const formData = new FormData($form);
  // for (const pair of formData.entries()) {
  //   console.log(pair[0], pair[1]);
  // }
  const days_of_week = new Array(7).fill("0");
  formData.getAll("days_of_week").forEach(i => {
    days_of_week[i - 1] = "1";
  });

  const body = JSON.stringify({
    activity_search_pattern: {
      center_ids: formData.getAll("center_ids"),
      activity_other_category_ids: formData.getAll(
        "activity_other_category_ids"
      ),
      activity_keyword: formData.get("activity_keyword"),
      activity_select_param: parseInt(
        formData.get("activity_select_param"),
        10
      ),
      days_of_week: days_of_week.join(""),
    },
  });
  console.log(body);

  const res = await fetchData(
    "http://localhost:3333/www-mounted/proxy-server/proxy.php?giulia=https://anc.ca.apm.activecommunities.com/vancouver/rest/activities/list",
    {
      method: "POST",
      headers: {
        Host: "anc.ca.apm.activecommunities.com",
        "Content-Type": "application/json",
        "Content-Length": body.length.toString(),
      },
      body: body,
    }
  );
  console.log("res", res);

  $activities.innerHTML = drawActivities(res.body.activity_items);
});
