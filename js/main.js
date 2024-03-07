'use strict';

const $$ = document.querySelector.bind(document);

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
    def: ['2'],
  },
  {
    title: 'Location',
    type: 'checkbox',
    name: 'center_ids',
    data: ORIGINAL_DATA.centers.map(({ id, desc }) => ({
      id: id,
      desc: desc.replace('*', ''),
    })),
    def: [],
  },
  {
    title: 'Age category',
    type: 'checkbox',
    name: 'activity_other_category_ids',
    data: ORIGINAL_DATA.othercategories,
    def: ['23'],
  },
  {
    title: 'Sort by',
    type: 'radio',
    name: 'order_by',
    data: ORIGINAL_DATA.sorts.map((item) => ({ id: item, desc: item })),
    def: ['Location'],
    hide: ['Ages'],
  },
];

const $form = $$('#form');
const $results = $$('#results');
const $advanced_search = $$('#advanced_search');

let ALL_ACTIVITIES = [];

const escapeHTML = (html) => {
  const fn = (tag) => {
    const charsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&#34;',
    };
    return charsToReplace[tag] || tag;
  };
  return html.replace(/[&<>"]/g, fn);
};

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
  const { title, type, name, def, data, hide } = fieldset;

  const code = `
      <fieldset id="${name}">
        <legend>${title}</legend>
        ${data
          .filter(({ id }) => !hide?.includes(id))
          .map((input) => drawInput(type, name, def, input))
          .join('')}
      </fieldset>
    `;

  return code;
};

const drawForm = (fieldsets) => {
  return fieldsets.map((fieldset) => drawFieldset(fieldset)).join('');
};

const drawActivity = (activity) => {
  const {
    already_enrolled,
    name,
    date_range,
    days_of_week,
    desc,
    id,
    number,
    time_range,
    total_open,
    urgent_message,
    giulia,
  } = activity;

  const code = `
      <tr>
        <td><a href="https://anc.ca.apm.activecommunities.com/vancouver/activity/search/detail/${id}" target="_blank" rel="noreferrer">${number}</a></td>
        <td title="${escapeHTML(desc)}">${name}</td>
        <td>${giulia.location}</td>
        <td>${days_of_week}</td>
        <td>${time_range}</td>
        <td>${date_range}</td>
        <td>${total_open}</td>
        <td>${already_enrolled}</td>
        <td>${giulia.openings}</td>
        <td>${giulia.calc_openings}</td>
        <td>${giulia.registration_date_formatted}</td>
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
            <th onclick="orderActivities(this,'number')"        data-sort="Number"      >Number</th>
            <th onclick="orderActivities(this,'name')"          data-sort="Name"        >Name</th>
            <th onclick="orderActivities(this,'location')"      data-sort="Location"    >Location</th>
            <th onclick="orderActivities(this,'day')"           data-sort="Days of week">Day</th>
            <th onclick="orderActivities(this,'time')"          data-sort="Time range"  >Time</th>
            <th onclick="orderActivities(this,'period')"        data-sort="Date range"  >Period</th>
            <th onclick="orderActivities(this,'total')"                                 >Total</th>
            <th onclick="orderActivities(this,'registered')"                            >Registered</th>
            <th onclick="orderActivities(this,'openings')"      data-sort="Openings"    >Openings</th>
            <th onclick="orderActivities(this,'calc_openings')"                         >Calc Op</th>
            <th onclick="orderActivities(this,'registration')"                          >Registration date</th>
            <th                                                                         >Status</th>
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

const getDayOfWeekNumber = (day) => {
  const week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return week.indexOf(day);
};

const formatTimeRange = (time) => {
  return time
    .split('-')
    .map((i) => {
      const b = i.trim();
      if (b === 'Noon') {
        return '12:00';
      } else {
        const c = b.split(' ');
        const d = c[0].split(':');
        const d0 = parseInt(d[0], 10);
        if (c[1] === 'AM') {
          if (d0 < 10) {
            return `0${c[0]}`;
          } else {
            return c[0];
          }
        } else {
          return `${d0 + 12}:${d[1]}`;
        }
      }
    })
    .join(' - ');
};

const formatActivities = (activities) => {
  activities.forEach((activity) => {
    activity.giulia = {
      location: activity.location.label.replace('*', ''),
      calc_openings: activity.total_open - activity.already_enrolled,
      registration_date_formatted: activity.activity_online_start_time
        ? `${activity.activity_online_start_time} (${new Date(
            activity.activity_online_start_time
          ).toLocaleString(undefined, { weekday: 'short' })})`
        : '',
      days_of_week_number: getDayOfWeekNumber(activity.days_of_week),
      openings: parseInt(activity.openings, 10),
      time: formatTimeRange(activity.time_range),
    };
  });
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

  ALL_ACTIVITIES.sort((a, b) => {
    let a1, b1;

    switch (what) {
      case 'number':
        a1 = a.number;
        b1 = b.number;
        break;
      case 'name':
        a1 = a.name;
        b1 = b.name;
        break;
      case 'location':
        a1 = a.giulia.location;
        b1 = b.giulia.location;
        break;
      case 'day':
        a1 = a.giulia.days_of_week_number;
        b1 = b.giulia.days_of_week_number;
        break;
      case 'time':
        a1 = a.giulia.time;
        b1 = b.giulia.time;
        break;
      case 'period':
        a1 = a.date_range_start;
        b1 = b.date_range_start;
        break;
      case 'total':
        a1 = a.total_open;
        b1 = b.total_open;
        break;
      case 'registered':
        a1 = a.already_enrolled;
        b1 = b.already_enrolled;
        break;
      case 'openings':
        a1 = a.giulia.openings;
        b1 = b.giulia.openings;
        break;
      case 'calc_openings':
        a1 = a.giulia.calc_openings;
        b1 = b.giulia.calc_openings;
        break;
      case 'registration':
        a1 = a.activity_online_start_time;
        b1 = b.activity_online_start_time;
        break;
    }

    if (newOrder === 'asc') {
      if (a1 < b1) {
        return -1;
      }
      if (a1 > b1) {
        return 1;
      }
      return 0;
    } else {
      if (a1 < b1) {
        return 1;
      }
      if (a1 > b1) {
        return -1;
      }
      return 0;
    }
  });

  $results.querySelector('tbody').innerHTML = ALL_ACTIVITIES.map((activity) =>
    drawActivity(activity)
  ).join('');
};

$advanced_search.innerHTML = drawForm(fieldsets);

$form.addEventListener('submit', async function (event) {
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

  $results.innerHTML = drawActivities(ALL_ACTIVITIES);
  $results
    .querySelector(`th[data-sort="${order_by}"]`)
    .setAttribute('data-order', 'asc');
});
