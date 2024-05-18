

  const linkColor = document.querySelectorAll('.nav__link')

  function colorLink(){
      linkColor.forEach(l => l.classList.remove('active-link'))
      this.classList.add('active-link')
  }
  
  linkColor.forEach(l => l.addEventListener('click', colorLink))
  

  
  
function myfunction() {
    var x = 1024;
    var y = 9999;
    var deg = Math.floor(Math.random() * (x - y)) + y; 
    document.getElementById('box').style.transform = "rotate("+deg+"deg)";

    var element = document.getElementById('mainbox');
    element.classList.remove('animate');
    setTimeout(function(){
        element.classList.add('animate');
        var valueList = ["Gaming","Homework","Sport","Sleep","Eat","Rest","Talk","Work",];
        var getValue = valueList[Math.floor(Math.random() * valueList.length)];
        // alert(getValue); 
    }, 1000);
}
function myfunction() {
    var x = 1024;
    var y = 9999;
    var deg = Math.floor(Math.random() * (x - y)) + y; 
    document.getElementById('box').style.transform = "rotate("+deg+"deg)";

    var element = document.getElementById('mainbox');
    element.classList.remove('animate');
    setTimeout(function(){
        element.classList.add('animate');
        var valueList = ["Gaming","Homework","Sport","Sleep","Eat","Rest","Talk","Work"];
        var getValue = valueList[Math.floor(Math.random() * valueList.length)];
        document.getElementById('quote').innerText = getQuote(getValue);
    }, 5000);
}

// Function to get the corresponding quote for the selected activity
function getQuote(activity) {
    switch (activity) {
        case "Gaming":
            return "Gaming - Level up life, conquer virtual quests!";
        case "Homework":
            return "Homework - Learn smart, achieve dreams, shine bright!";
        case "Sport":
            return "Sport - Chase passions, get fit, live strong!";
        case "Sleep":
            return "Sleep - Rest well, awake to conquer anew!";
        case "Eat":
            return "Eat - Nourish, delight, savor life's nourishment!";
        case "Rest":
            return "Rest - Recharge, find peace, conquer challenges ahead!";
        case "Talk":
            return "Talk - Speak kind, inspire hearts, create positive change!";
        case "Work":
            return "Work - Passion fuels purpose, chase dreams relentlessly!";
        default:
            return "";
    }
}




function toggleDarkMode() {
  const body = document.body;
  const spacebt = document.querySelector('.spacebt');
  const radioInner = document.querySelector('.radio-inner');

  // Toggle the dark mode class on the body element
  body.classList.toggle('dark-mode');

  // Toggle the position of the radio button
  radioInner.style.transform = body.classList.contains('dark-mode')
    ? 'translateX(25px)'
    : '';

  // Optionally, you can change the text of the toggle button if needed
  // spacebt.innerText = body.classList.contains('dark-mode')
  //   ? 'Light Mode'
  //   : 'Dark Mode';
}

let subMenu = document.getElementById("subMenu");
        
function toggleMenu(){
    subMenu.classList.toggle("open-menu");
}
