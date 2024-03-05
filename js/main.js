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
const $activities = $$('#activities');
const $advanced_search = $$('#advanced_search');

const drawInput = function (type, name, def, input) {
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

const drawFieldset = function (fieldset) {
  const { title, type, name, def, data } = fieldset;

  const code = `
      <fieldset id="${name}">
        <legend>${title}</legend>
        ${data.map((input) => drawInput(type, name, def, input)).join('')}
      </fieldset>
    `;

  return code;
};

const fetchJsonData = async (url, options) => {
  const response = await fetch(url, options);
  const data = await response.json();
  return data;
};

fieldsets.forEach((fieldset) => {
  $advanced_search.innerHTML += drawFieldset(fieldset);
});

const drawActivities = function (activities) {
  if (activities.length === 0) {
    return `No activities found`;
  }

  const code = `
      Found ${activities.length} activities
      <table>
        <thead>
          <tr>
            <th>Number</th>
            <th>Name</th>
            <th>Location</th>
            <th>Day</th>
            <th>Time</th>
            <th>Period</th>
            <th>Registered</th>
            <th>Total</th>
            <th>Open</th>
            <th>Registration date</th>
          </tr>
        </thead>
        <tbody>
          ${activities.map((activity) => drawActivity(activity)).join('')}
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
  // console.log(res);

  activities.splice(
    (res.headers.page_info.page_number - 1) *
      res.headers.page_info.total_records_per_page,
    0,
    ...res.body.activity_items
  );

  return res;
};

$form.on('submit', async function (event) {
  event.preventDefault();
  $activities.innerHTML = 'Searching...';

  const formData = new FormData($form);
  // for (const pair of formData.entries()) {
  //   console.log(pair[0], pair[1]);
  // }
  const days_of_week = new Array(7).fill('0');
  formData.getAll('days_of_week').forEach((i) => {
    days_of_week[i - 1] = '1';
  });
  const order_by = formData.get('order_by');
  const page_number = 1;

  const body = JSON.stringify({
    activity_search_pattern: {
      center_ids: formData.getAll('center_ids'),
      activity_other_category_ids: formData.getAll(
        'activity_other_category_ids'
      ),
      activity_keyword: formData.get('activity_keyword'),
      activity_select_param: parseInt(
        formData.get('activity_select_param'),
        10
      ),
      days_of_week: days_of_week.join(''),
    },
  });
  // console.log(body);

  const fetches = [];
  const activities = [];
  fetches[page_number - 1] = await fetchActivities(
    activities,
    body,
    order_by,
    page_number
  );

  const total_page = fetches[page_number - 1]?.headers?.page_info?.total_page;

  if (total_page > 1) {
    for (let i = 2; i <= total_page; i++) {
      fetches[i - 1] = fetchActivities(activities, body, order_by, i);
      // console.log(i);
    }
  }
  Promise.all(fetches).then(function () {
    // console.log(activities);
    $activities.innerHTML = drawActivities(activities);
  });
});
