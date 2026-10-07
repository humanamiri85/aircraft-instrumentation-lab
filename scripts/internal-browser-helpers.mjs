// Shared control dispatch preserves each lesson's scientific assertions.
export async function setControl(page,key,value) {
  await page.locator(`#${key}`).evaluate((input,next)=>{
    input.value=next;input.dispatchEvent(new Event('input',{bubbles:true}));
  },value);
}
export async function openInternal(page,instrument,prefix) {
  await page.locator(`[data-instrument="${instrument}"]`).click();
  await page.locator('#inside-instrument').click();
  await page.locator(`#${prefix}-tab-cutaway`).waitFor({state:'visible'});
  return page.locator(`#${prefix}-internal`);
}
