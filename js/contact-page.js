/* Valley Desk — Contact Us page interactions */

function handleContactSubmit(ev) {
  ev.preventDefault();
  const form = ev.target;
  const name = form.querySelector("#cfName").value.trim();
  const email = form.querySelector("#cfEmail").value.trim();
  const message = form.querySelector("#cfMessage").value.trim();

  if (!name || !email || !message) {
    showToast("Please fill in your name, email & message");
    return false;
  }

  const successBox = document.getElementById("formSuccess");
  if (successBox) {
    successBox.classList.add("show");
    successBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  showToast("Message ready — thanks for reaching out!");
  form.reset();
  return false;
}
