var DROPDOWN_VISIBLE = false
setupEventListeners = function() {
    console.log("Setting up!");
    document.getElementById("mobile_dropdown_toggle").addEventListener("click", () => {
        toggleDropdown();
    });
}
toggleDropdown = function() {
    console.log("Trigger!");
    DROPDOWN_VISIBLE = !DROPDOWN_VISIBLE;
    let target_height = DROPDOWN_VISIBLE ? "6rem" : 0;
    let target_colour = DROPDOWN_VISIBLE ? "#eee" : "rgba(0,0,0,0)";
    document.getElementById("mobile_dropdown").style.height = target_height;
    document.getElementById("mobile_dropdown").style.borderColor = target_colour;
}

window.onload = function() {
    setupEventListeners();
    console.log("Page load successful!");
}