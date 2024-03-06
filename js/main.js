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

const drawActivity = (activity) => {
  const {
    activity_online_start_time,
    already_enrolled,
    name,
    date_range,
    days_of_week,
    id,
    number,
    time_range,
    total_open,
    urgent_message,
    giulia,
  } = activity;

  const code = `
      <tr>
        <td><a href="https://anc.ca.apm.activecommunities.com/vancouver/activity/search/enroll/${id}" target="_blank" rel="noreferrer">${number}</a></td>
        <td>${name}</td>
        <td>${giulia.location}</td>
        <td>${days_of_week}</td>
        <td>${time_range}</td>
        <td>${date_range}</td>
        <td>${already_enrolled}</td>
        <td>${total_open}</td>
        <td>${giulia.open_spots}</td>
        <td><time datetime="${activity_online_start_time}">${giulia.registration_date_formatted}</time></td>
        <td>${urgent_message.status_description}</td>
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
            <th>Number</th>
            <th onclick="orderActivities(this,'name')">Name</th>
            <th onclick="orderActivities(this,'location')">Location</th>
            <th onclick="orderActivities(this,'day')">Day</th>
            <th>Time</th>
            <th onclick="orderActivities(this,'period')">Period</th>
            <th onclick="orderActivities(this,'registered')">Registered</th>
            <th onclick="orderActivities(this,'total')">Total</th>
            <th onclick="orderActivities(this,'open')">Open</th>
            <th onclick="orderActivities(this,'registration')">Registration date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${activities.map((activity) => drawActivity(activity)).join('')}
        </tbody>
      </table>
    `;

  return code;
};

const fetchJsonData = async (url, options) => {
  const response = await fetch(url, options);
  const data = await response.json();
  return data;
};

const fetchActivities = async ({ activities, body, order_by, page_number }) => {
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

const fetchAllActivities = async ({
  activity_keyword,
  activity_other_category_ids,
  activity_select_param,
  center_ids,
  days_of_week,
  order_by,
}) => {
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
  const activities = [];

  fetches[0] = await fetchActivities({
    activities,
    body,
    order_by,
    page_number: 1,
  });

  const total_page = fetches[0]?.headers?.page_info?.total_page;

  if (total_page > 1) {
    for (let i = 2; i <= total_page; i++) {
      fetches[i - 1] = fetchActivities({
        activities,
        body,
        order_by,
        page_number: i,
      });
    }
  }

  await Promise.all(fetches);
  return activities;
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

const orderActivities = function (el, what) {
  const order = el.getAttribute('data-order');
  const $tr = el.parentNode.querySelectorAll('th[onclick]');
  let newOrder;

  if (order === 'asc') {
    newOrder = 'desc';
  } else {
    newOrder = 'asc';
  }

  $tr.forEach(($el) => {
    $el.removeAttribute('data-order');
  });
  el.setAttribute('data-order', newOrder);
};

const getDayOfWeekNumber = (day) => {
  const week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return week.indexOf(day);
};

const formatActivities = (activities) => {
  activities.forEach((activity) => {
    activity.giulia = {
      location: activity.location.label.replace('*', ''),
      open_spots: activity.total_open - activity.already_enrolled,
      registration_date_formatted: activity.activity_online_start_time,
      days_of_week_number: getDayOfWeekNumber(activity.days_of_week),
    };
  });
};

$advanced_search.innerHTML = drawForm(fieldsets);

$form.on('submit', async function (event) {
  event.preventDefault();
  $results.innerHTML = 'Searching...';

  const {
    activity_keyword,
    activity_other_category_ids,
    activity_select_param,
    center_ids,
    days_of_week,
    order_by,
  } = getFormData(this);

  ALL_ACTIVITIES = await fetchAllActivities({
    activity_keyword,
    activity_other_category_ids,
    activity_select_param,
    center_ids,
    days_of_week,
    order_by,
  });

  formatActivities(ALL_ACTIVITIES);
  console.log(ALL_ACTIVITIES);

  $results.innerHTML = drawActivities(ALL_ACTIVITIES);
});
