import Framework from './framework';

var node_name = "";

class JsWdIoFramework extends Framework {

  get language () {
    return "js";
  }

  chainifyCode (code) {
    return code
      .replace(/let .+ = /g, '')
      .replace(/(\n|^)(driver|el.+)\./g, '\n.')
  }

  wrapWithBoilerplate (code) {
    let host = JSON.stringify(this.host);
    let caps = JSON.stringify(this.caps);
    let proto = JSON.stringify(this.scheme);
    let path = JSON.stringify(this.path);
    return `// Starts at <feature>

function featureName(d) {
${this.indent(this.chainifyCode(code), 2)}

  return d;
}

// Ends at <feature>

module.exports = {
  featureName: featureName,
};`;

  }

  codeFor_findAndAssign (strategy, locator, localVar, isArray) {
    // wdio has its own way of indicating the strategy in the locator string
    switch (strategy) {
      case "xpath": break; // xpath does not need to be updated
      case "accessibility id": locator = `~${locator}`; break;
      case "id": locator = `${locator}`; break;
      case "name": locator = `name=${locator}`; break;
      case "class name": locator = `${locator}`; break;
      case "-android uiautomator": locator = `android=${locator}`; break;
      case "-ios predicate string": locator = `ios=${locator}`; break;
      case "-ios class chain": locator = `ios=${locator}`; break; // TODO: Handle IOS class chain properly. Not all libs support it. Or take it out
      default: throw new Error(`Can't handle strategy ${strategy}`);
    }
    node_name = locator;
  }

  codeFor_click (varName, varIndex) {
    return `d = d.click(${JSON.stringify(node_name)});`;
  }

  codeFor_clear (varName, varIndex) {
    return `d = d.clearElement(${JSON.stringify(node_name)});`;
  }

  codeFor_sendKeys (varName, varIndex, text) {
    return `d = d.setValue(${JSON.stringify(node_name)}, ${JSON.stringify(text)});`;
  }

  codeFor_back () {
    return `d = d.back();`;
  }

  codeFor_tap (varNameIgnore, varIndexIgnore, x, y) {
    return `d = d.touchAction({actions: 'tap', x: ${x}, y: ${y}});`;
  }

  codeFor_swipe (varNameIgnore, varIndexIgnore, x1, y1, x2, y2) {
    return `// Describe action
d = d.touchAction([
  {action: 'press', x: ${x1}, y: ${y1}},
  {action: 'moveTo', x: ${x2}, y: ${y2}},
  'release'
]);`;
  }
}

JsWdIoFramework.readableName = "JS - Webdriver.io";

export default JsWdIoFramework;
