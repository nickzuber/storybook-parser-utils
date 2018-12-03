const Colors = {
  Red: '\u001b[31m',
  Green: '\u001b[32;1m',
  Gray: '\u001b[90m',
  Reset: '\u001b[39;0m',
};

function formatLine (line, number, padSize) {
  if (line === undefined) {
    return `${'*'.padStart(padSize)} |`;
  }
  return `${number.toString().padStart(padSize)} | ${line}`;
}

function printAsError (fileString, line, column) {
  const lines = fileString.split('\n');
  const topIndex = line - 3;
  const aboveIndex = line - 2;
  const currentIndex = line - 1;
  const belowIndex = line;
  const bottomIndex = line + 1;
  const numberWidth = (belowIndex + 1).toString().length;

  return [
    `   ${Colors.Gray} ${formatLine(lines[topIndex], topIndex + 1, numberWidth)} ${Colors.Reset}`,
    `   ${Colors.Gray} ${formatLine(lines[aboveIndex], aboveIndex + 1, numberWidth)} ${Colors.Reset}`,
    ` ${Colors.Green} >${Colors.Reset} ${formatLine(lines[currentIndex], currentIndex + 1, numberWidth)}`,
    `   ${Colors.Gray} ${' '.padStart(numberWidth)} |${Colors.Green} ${'^'.padStart(column)} ${Colors.Reset}`,
    `   ${Colors.Gray} ${formatLine(lines[belowIndex], belowIndex + 1, numberWidth)} ${Colors.Reset}`,
    `   ${Colors.Gray} ${formatLine(lines[bottomIndex], bottomIndex + 1, numberWidth)} ${Colors.Reset}`,
  ].join('\n');
}

module.exports.printAsError = printAsError;
