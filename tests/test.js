function test_date(){
    // dec 9 2023 1:59:27 PM
    let d1 = "2023-12-09T13:59:27.000-05:00"
    let d = new Date(d1)
    console.log(d)
    let dt1 = formatTimestamp2(d)
    console.log(dt1)
 }
  

  function formatTimestamp2(date) {
    let formatter = new Intl.DateTimeFormat("en", {
        timeZone: "US/Eastern",// context.timezone, // Use the doc's timezone (important!)
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric', 
        hour12: false
       });
    
    // Format the date into individual parts.
    const parts = formatter.formatToParts(date).reduce((obj, part) => {
        obj[part.type] = part.value;
        return obj;
      }, {});
    console.log(parts)   
     let format = "{year}-{month}-{day} {hour}:{minute}:{second}"
    // Convert parts to an object for easy access
    let out = format.replace(/\{(.*?)}/g, (x,g)=> parts[g]);
    console.log(out)
 }
  module.exports = { test_date };