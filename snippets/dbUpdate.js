const checkAllCheckboxes = () => {
  const checkboxIds = [
      "cmscockpit_sample",
      "autoimporter_sample",
      "btocockpits_sample",
      "btoshop_sample",
      "btocore_sample"
  ]

  checkboxIds.forEach(id => {
      document.querySelector(`#${id}`)?.click()
  })
}


const selectAllValues = () => {
  const selectValues = {
      "btocore_cockpitComponents": "yes"
  }

  Object.entries(selectValues).forEach(([ selectId, value ]) => {
      const select = document.querySelector(`#${selectId}`);
      if (!select) return;

      select.value = value;
  })
}

checkAllCheckboxes();
selectAllValues();