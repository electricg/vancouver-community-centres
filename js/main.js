'use strict';

const $ = document.querySelectorAll.bind(document);
const $$ = document.querySelector.bind(document);
Element.prototype.on = Element.prototype.addEventListener;

// https://developer.mozilla.org/en/docs/Web/API/NodeList
NodeList.prototype.forEach = Array.prototype.forEach;

const fieldsets = [
  {
    title: 'Days of the week',
    type: 'checkbox',
    name: 'days_of_week',
    data: DAYS_OF_WEEK,
  },
  {
    title: 'Status',
    type: 'radio',
    name: 'activity_select_param',
    data: STATUS,
    def: ['0'],
  },
  {
    title: 'Location',
    type: 'checkbox',
    name: 'center_ids',
    data: ORIGINAL_DATA.centers.map(({ id, desc }) => ({
      id: id,
      desc: desc.replace('*', ''),
    })),
    def: ['38', '6', '29', '42'],
  },
  {
    title: 'Age category',
    type: 'checkbox',
    name: 'activity_other_category_ids',
    data: ORIGINAL_DATA.othercategories,
    def: ['23'],
  },
  {
    title: 'Sorty by',
    type: 'radio',
    name: 'order_by',
    data: ORIGINAL_DATA.sorts.map((item) => ({ id: item, desc: item })),
    def: ['Location'],
  },
];

const $form = $$('#form');
const $results = $$('#results');
const $advanced_search = $$('#advanced_search');

let ALL_ACTIVITIES = [];

const drawInput = (type, name, def, input) => {
  const { id, desc } = input;
  const code = `
      <label for="${name}_${id}">
        <input type="${type}" name="${name}" id="${name}_${id}" value="${id}"${
    def?.includes(id) ? 'checked' : ''
  }>${desc}
      </label>
    `;

  return code;
};

const drawFieldset = (fieldset) => {
  const { title, type, name, def, data } = fieldset;

  const code = `
      <fieldset id="${name}">
        <legend>${title}</legend>
        ${data.map((input) => drawInput(type, name, def, input)).join('')}
      </fieldset>
    `;

  return code;
};

const drawForm = (fieldsets) => {
  return fieldsets.map((fieldset) => drawFieldset(fieldset)).join('');
};

const fetchJsonData = async (url, options) => {
  const response = await fetch(url, options);
  const data = await response.json();
  return data;
};

const drawActivity = (activity) => {
  const {
    activity_online_start_time,
    already_enrolled,
    name,
    date_range,
    days_of_week,
    location,
    id,
    number,
    time_range,
    total_open,
  } = activity;

  const code = `
      <tr>
        <td><a href="https://anc.ca.apm.activecommunities.com/vancouver/activity/search/enroll/${id}" target="_blank" rel="noreferrer">${number}</a></td>
        <td>${name}</td>
        <td>${location.label}</td>
        <td>${days_of_week}</td>
        <td>${time_range}</td>
        <td>${date_range}</td>
        <td>${already_enrolled}</td>
        <td>${total_open}</td>
        <td>${total_open - already_enrolled}</td>
        <td>${activity_online_start_time}</td>
      </tr>
    `;

  return code;
};

const drawActivities = (activities) => {
  if (activities.length === 0) {
    return `No activities found`;
  }

  const code = `
      Found ${activities.length} activities
      <table>
        <thead>
          <tr>
            <th onclick="orderActivities('number')">Number</th>
            <th onclick="orderActivities('name')">Name</th>
            <th onclick="orderActivities('location')">Location</th>
            <th onclick="orderActivities('day')">Day</th>
            <th onclick="orderActivities('time')">Time</th>
            <th onclick="orderActivities('period')">Period</th>
            <th onclick="orderActivities('registered')">Registered</th>
            <th onclick="orderActivities('total')">Total</th>
            <th onclick="orderActivities('open')">Open</th>
            <th onclick="orderActivities('registration')">Registration date</th>
          </tr>
        </thead>
        <tbody>
          ${activities.map((activity) => drawActivity(activity)).join('')}
        </tbody>
      </table>
    `;

  return code;
};

const fetchActivities = async (activities, body, order_by, page_number) => {
  const res = await fetchJsonData(
    'https://proxy.giulia.dev/proxy.php?giulia=https://anc.ca.apm.activecommunities.com/vancouver/rest/activities/list',
    {
      method: 'POST',
      headers: {
        Host: 'anc.ca.apm.activecommunities.com',
        'Content-Type': 'application/json',
        'Content-Length': body.length.toString(),
        Page_info: `{"order_by":"${order_by}","page_number":${page_number}}`,
      },
      body: body,
    }
  );

  activities.splice(
    (res.headers.page_info.page_number - 1) *
      res.headers.page_info.total_records_per_page,
    0,
    ...res.body.activity_items
  );

  return res;
};

const orderActivities = (what) => {
  console.log(what);
};

const getFormData = (form) => {
  const formData = new FormData(form);

  const days_of_week = new Array(7).fill('0');
  formData.getAll('days_of_week').forEach((i) => {
    days_of_week[i - 1] = '1';
  });

  const order_by = formData.get('order_by');

  return {
    days_of_week: days_of_week.join(''),
    order_by,
    center_ids: formData.getAll('center_ids'),
    activity_other_category_ids: formData.getAll('activity_other_category_ids'),
    activity_keyword: formData.get('activity_keyword'),
    activity_select_param: parseInt(formData.get('activity_select_param'), 10),
  };
};

$advanced_search.innerHTML = drawForm(fieldsets);

$form.on('submit', async function (event) {
  event.preventDefault();
  $results.innerHTML = 'Searching...';

  const page_number = 1;

  const {
    activity_keyword,
    activity_other_category_ids,
    activity_select_param,
    center_ids,
    days_of_week,
    order_by,
  } = getFormData(this);

  const body = JSON.stringify({
    activity_search_pattern: {
      activity_keyword,
      activity_other_category_ids,
      activity_select_param,
      center_ids,
      days_of_week,
    },
  });

  const fetches = [];
  ALL_ACTIVITIES = [];

  fetches[0] = await fetchActivities(
    ALL_ACTIVITIES,
    body,
    order_by,
    page_number
  );

  const total_page = fetches[0]?.headers?.page_info?.total_page;

  if (total_page > 1) {
    for (let i = 2; i <= total_page; i++) {
      fetches[i - 1] = fetchActivities(ALL_ACTIVITIES, body, order_by, i);
    }
  }

  Promise.all(fetches).then(function () {
    console.log(ALL_ACTIVITIES);
    $results.innerHTML = drawActivities(ALL_ACTIVITIES);
  });
});
