const fs = require('fs');
const path = require('path');

const slide1Path = path.join(__dirname, '..', 'temp_pptx', 'ppt', 'slides', 'slide1.xml');
const slide2Path = path.join(__dirname, '..', 'temp_pptx', 'ppt', 'slides', 'slide2.xml');
const slide3Path = path.join(__dirname, '..', 'temp_pptx', 'ppt', 'slides', 'slide3.xml');
const slide4Path = path.join(__dirname, '..', 'temp_pptx', 'ppt', 'slides', 'slide4.xml');
const appPath = path.join(__dirname, '..', 'temp_pptx', 'docProps', 'app.xml');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Process Slide 1
if (fs.existsSync(slide1Path)) {
  let s1Content = fs.readFileSync(slide1Path, 'utf8');
  s1Content = s1Content.replace(/<a:t>AI Powered Test Oracle<\/a:t>/g, '<a:t>TestNexus: AI-Powered Test Management<\/a:t>');
  fs.writeFileSync(slide1Path, s1Content, 'utf8');
  console.log('Slide 1 updated.');
}

// Process Slide 2
if (fs.existsSync(slide2Path)) {
  let s2Content = fs.readFileSync(slide2Path, 'utf8');
  
  const replacements = [
    ['Decision Intelligence Layer', 'AI-Powered Test Management Platform'],
    ['Knowledge', 'Test Plan'],
    [' Sources', ' Inputs'],
    ['Internal SharePoints', 'Excel Sheets & Test Plans'],
    ['ADO/JIRA ', 'JIRA / ADO Backlog'],
    ['requires admin support', 'Direct Import Integration'],
    ['Design Documents', 'Unstructured Test Docs'],
    ['User Stories / Use Cases', 'User Stories & Requirements'],
    ['Documented Team Knowledge', 'Tester Capacity & Profiles'],
    ['AI', 'Test'],
    [' Powered', ' Nexus'],
    ['Copilot ', 'AI Parser & Mapper'],
    ['Agent Builder', 'AI Advisor Agent'],
    ['Test Oracle AI Agent.', 'TestNexus AI Engine.'],
    ['Test Oracle AI Agent. ', 'TestNexus AI Engine. '],
    ['One source of truth. Better test decisions.', 'One source of truth. Proactive strategy & execution.'],
    ['One source of truth. Better test decisions. ', 'One source of truth. Proactive strategy & execution. '],
    ['Testing Quality', 'Testing Quality & Speed'],
    ['Validates expected behavior', 'Auto-extracts clean test cases in seconds'],
    ['More accurate &amp; Consistent bug reporting', 'Instant Burndown &amp; Blocker Hub updates'],
    ['More accurate & Consistent bug reporting', 'Instant Burndown & Blocker Hub updates'],
    ['People &amp; Capability', 'Workload &amp; Capacity'],
    ['People & Capability', 'Workload & Capacity'],
    ['Provides SME‑level guidance', 'Calculates daily workloads automatically'],
    ['Accelerates onboarding', 'Dynamic auto-assign balances tasks'],
    ['Operational Impact', 'Project Intelligence'],
    ['Reduces knowledge silos', 'Proactive slippage &amp; risk alerts'],
    ['Reduces knowledge silos', 'Proactive slippage & risk alerts'],
    ['Reduces the time needed to retrieve and analyze documents', 'Daily strategic advice on bottlenecks'],
    ['Improved Customer Care Efficiency If Connected to SCIO', 'Tabbed views for multi-project visibility']
  ];

  for (const [target, replacement] of replacements) {
    const regex = new RegExp(`<a:t>${escapeRegExp(target)}<\/a:t>`, 'g');
    if (s2Content.match(regex)) {
      s2Content = s2Content.replace(regex, `<a:t>${replacement}</a:t>`);
      console.log(`Replaced: "${target}" -> "${replacement}"`);
    } else {
      console.log(`Not found (skipped): "${target}"`);
    }
  }
  
  fs.writeFileSync(slide2Path, s2Content, 'utf8');
  console.log('Slide 2 updated.');
}

// Process Slide 3
if (fs.existsSync(slide3Path)) {
  let s3Content = fs.readFileSync(slide3Path, 'utf8');
  s3Content = s3Content.replace(/<a:t>Demo<\/a:t>/g, '<a:t>TestNexus Demo<\/a:t>');
  fs.writeFileSync(slide3Path, s3Content, 'utf8');
  console.log('Slide 3 updated.');
}

// Process Slide 4
if (fs.existsSync(slide4Path)) {
  let s4Content = fs.readFileSync(slide4Path, 'utf8');
  s4Content = s4Content.replace(/Test Oracle Early Demo/g, 'TestNexus Demo Video');
  s4Content = s4Content.replace(/Test Oracle/g, 'TestNexus');
  fs.writeFileSync(slide4Path, s4Content, 'utf8');
  console.log('Slide 4 updated.');
}

// Process app.xml
if (fs.existsSync(appPath)) {
  let appContent = fs.readFileSync(appPath, 'utf8');
  appContent = appContent.replace(/AI Powered Test Oracle/g, 'TestNexus');
  appContent = appContent.replace(/Test Oracle/g, 'TestNexus');
  fs.writeFileSync(appPath, appContent, 'utf8');
  console.log('docProps/app.xml updated.');
}
