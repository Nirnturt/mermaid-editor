export const lightTheme = {
  // Base colors from theme-neutral.js: https://github.com/mermaid-js/mermaid/blob/develop/packages/mermaid/src/themes/theme-neutral.js
  primaryColor: '#f4f4f4',        // Main background for shapes
  primaryTextColor: '#1f1f1f',
  primaryBorderColor: '#1f1f1f',
  lineColor: '#1f1f1f',
  textColor: '#1f1f1f',            // General text color
  mainBkg: '#f4f4f4',            // Diagram background, same as primaryColor

  secondaryColor: '#e0e0e0',      // Approximated for sub-graphs, etc.
  secondaryTextColor: '#333333',
  secondaryBorderColor: '#aaaaaa',

  tertiaryColor: '#d0d0d0',       // Approximated for actors, etc.
  tertiaryTextColor: '#555555',
  tertiaryBorderColor: '#888888',

  errorBkgColor: '#eb9d9d',
  errorTextColor: '#000000',
  
  // Diagram-specific values from theme-neutral.js, mapped to our neutral palette
  // Flowchart
  nodeBorder: '#1f1f1f',          // Same as primaryBorderColor
  nodeTextColor: '#1f1f1f',        // Same as primaryTextColor

  // Sequence Diagram
  sequenceNumbers: '#1f1f1f',      // Text color for sequence numbers, on a light background
  actorBorder: '#888888',          // Same as tertiaryBorderColor
  actorBkg: '#d0d0d0',            // Same as tertiaryColor
  actorTextColor: '#555555',      // Same as tertiaryTextColor
  labelBoxBkgColor: '#e0e0e0',    // Background for labels, using secondaryColor
  labelTextColor: '#1f1f1f',      // Text for labels, using primaryTextColor
  loopTextColor: '#1f1f1f',        // Same as primaryTextColor
  noteBorderColor: '#aaaaaa',     // Using secondaryBorderColor for notes
  noteBkgColor: '#f8f8f8',        // A very light gray for note backgrounds, slightly off-white
  noteTextColor: '#1f1f1f',      // Same as primaryTextColor
  activationBorderColor: '#1f1f1f',// Same as primaryBorderColor
  activationBkgColor: '#f4f4f4',  // Same as primaryColor
  messageLine0: '#1f1f1f',        // Same as lineColor
  messageLine1: '#1f1f1f',        // Same as lineColor
  messageTextColor: '#1f1f1f',    // Same as primaryTextColor

  // Class Diagram
  classText: '#1f1f1f',            // Same as primaryTextColor

  // State Diagram
  labelColor: '#1f1f1f',          // Text color for state labels, same as primaryTextColor
  altBackground: '#f0f0f0',      // An alternate light gray background
  stateBkg: '#f4f4f4',
  stateBorder: '#1f1f1f',
  transitionColor: '#1f1f1f',
  transitionLabelColor: '#333333',
  stateLabelColor: '#1f1f1f',

  // Gantt Chart
  taskTextDarkColor: '#1f1f1f',
  taskTextLightColor: '#f4f4f4',  // For text on potentially darker task custom styles
  taskTextOutsideColor: '#1f1f1f',
  taskTextClickableColor: '#1f1f1f', // Default to dark text
  taskBorderColor: '#1f1f1f',
  taskBkgColor: '#e8e8e8',        // Generic task background
  activeTaskBorderColor: '#1f1f1f',
  activeTaskBkgColor: '#d8d8d8',  // Slightly darker for active tasks
  gridColor: '#aaaaaa',
  doneTaskBkgColor: '#c8c8c8',
  doneTaskBorderColor: '#888888',
  critTaskBkgColor: '#e0e0e0',    // Critical task background, using secondaryColor
  critTaskBorderColor: '#1f1f1f',
  todayLineColor: '#cc0000',      // A contrasting color for today line

  // Journey Diagram
  fillType0: '#f4f4f4',
  fillType1: '#e0e0e0',
  fillType2: '#d0d0d0',
  fillType3: '#bfbfbf',
  fillType4: '#aaaaaa',
  fillType5: '#999999',
  fillType6: '#888888',
  fillType7: '#777777',
  
  // Pie Chart
  pie1: '#f4f4f4',
  pie2: '#e0e0e0',
  pie3: '#d0d0d0',
  pie4: '#bfbfbf',
  pie5: '#aaaaaa',
  pie6: '#999999',
  pie7: '#888888',
  pie8: '#777777',
  pie9: '#666666',
  pie10: '#555555',
  pie11: '#444444',
  pie12: '#333333',
  pieStroke: '#1f1f1f',
  pieOuterStroke: '#1f1f1f',
  pieOpacity: '1',
  pieTitleTextSize: '18px',
  pieTitleTextColor: '#1f1f1f',
  pieSectionTextSize: '14px',
  pieSectionTextColor: '#1f1f1f',
  pieLegendTextSize: '14px',
  pieLegendTextColor: '#1f1f1f',

  // Quadrant Chart
  quadrant1Fill: '#f4f4f4',
  quadrant2Fill: '#e0e0e0',
  quadrant3Fill: '#d0d0d0',
  quadrant4Fill: '#bfbfbf',
  quadrant1Text: '#1f1f1f',
  quadrant2Text: '#1f1f1f',
  quadrant3Text: '#1f1f1f',
  quadrant4Text: '#1f1f1f',
  quadrantPointFill: '#1f1f1f',
  quadrantPointText: '#f4f4f4',
  quadrantXAxisText: '#1f1f1f',
  quadrantYAxisText: '#1f1f1f',
  quadrantInternalBorder: '#aaaaaa',
  quadrantExternalBorder: '#1f1f1f',
  quadrantTitle: '#1f1f1f',

  // General application settings (already present, but reiterated for clarity of source)
  fontSize: '14px',              // Current app default
  fontFamily: 'sans-serif',        // Current app default
  background: '#ffffff',         // Canvas background for the app, distinct from diagram mainBkg
};

export const darkTheme = {
  // Base colors from theme-dark.js: https://github.com/mermaid-js/mermaid/blob/develop/packages/mermaid/src/themes/theme-dark.js
  // General palette
  background: '#2d2d2d',        // Mermaid diagram internal background
  primaryColor: '#1e1e1e',        // Main background for shapes (often very dark or same as mainBkg)
  primaryTextColor: '#e0e0e0',
  primaryBorderColor: '#c0c0c0',

  secondaryColor: '#2a2a2a',      // Slightly lighter dark for secondary elements (e.g., subgraphs)
  secondaryTextColor: '#d0d0d0',
  secondaryBorderColor: '#b0b0b0',

  tertiaryColor: '#383838',       // Another shade of dark (e.g., actors)
  tertiaryTextColor: '#c0c0c0',
  tertiaryBorderColor: '#a0a0a0',

  lineColor: '#e0e0e0',            // Light lines for contrast
  textColor: '#e0e0e0',            // General text color
  mainBkg: '#1e1e1e',            // Main diagram background, should be very dark

  errorBkgColor: '#581818',      // Dark red for error background
  errorTextColor: '#e0e0e0',

  // Diagram-specific values, mapped to a dark palette
  // Flowchart
  nodeBorder: '#c0c0c0',          // Same as primaryBorderColor
  nodeTextColor: '#e0e0e0',        // Same as primaryTextColor

  // Sequence Diagram
  sequenceNumbers: '#e0e0e0',      // Text color for sequence numbers
  actorBorder: '#a0a0a0',          // Same as tertiaryBorderColor
  actorBkg: '#383838',            // Same as tertiaryColor
  actorTextColor: '#c0c0c0',      // Same as tertiaryTextColor
  labelBoxBkgColor: '#2a2a2a',    // Background for labels, using secondaryColor
  labelTextColor: '#e0e0e0',      // Text for labels, using primaryTextColor
  loopTextColor: '#e0e0e0',        // Same as primaryTextColor
  noteBorderColor: '#b0b0b0',     // Using secondaryBorderColor for notes
  noteBkgColor: '#252525',        // Darker note background
  noteTextColor: '#e0e0e0',      // Same as primaryTextColor
  activationBorderColor: '#c0c0c0',// Same as primaryBorderColor
  activationBkgColor: '#1e1e1e',  // Same as primaryColor or mainBkg
  messageLine0: '#e0e0e0',        // Same as lineColor
  messageLine1: '#d0d0d0',        // Slightly different for arrows if needed, else same as lineColor
  messageTextColor: '#e0e0e0',    // Same as primaryTextColor

  // Class Diagram
  classText: '#e0e0e0',            // Same as primaryTextColor

  // State Diagram
  labelColor: '#e0e0e0',          // Text color for state labels
  altBackground: '#2c2c2c',      // An alternate dark gray background
  stateBkg: '#1e1e1e',
  stateBorder: '#c0c0c0',
  transitionColor: '#e0e0e0',
  transitionLabelColor: '#d0d0d0',
  stateLabelColor: '#e0e0e0',

  // Gantt Chart
  taskTextDarkColor: '#e0e0e0',    // Text on lighter parts of task if any in dark mode (usually all text light)
  taskTextLightColor: '#1e1e1e',  // Text on lighter task backgrounds (e.g. if a task is bright yellow)
  taskTextOutsideColor: '#e0e0e0',
  taskTextClickableColor: '#87cefa', // LightSkyBlue for clickable text, good on dark
  taskBorderColor: '#c0c0c0',
  taskBkgColor: '#4a4a4a',        // Darker gray for tasks
  activeTaskBorderColor: '#e0e0e0', // Lighter border for active
  activeTaskBkgColor: '#5a5a5a',  // Slightly lighter dark for active tasks
  gridColor: '#777777',          // Dimmer grid lines
  doneTaskBkgColor: '#3a3a3a',
  doneTaskBorderColor: '#888888',
  critTaskBkgColor: '#530053',    // Dark purple for critical tasks
  critTaskBorderColor: '#e0e0e0',
  todayLineColor: '#ff4500',      // OrangeRed for today line

  // Journey Diagram (shades of dark gray/blue)
  fillType0: '#1e1e1e',
  fillType1: '#2a2a2a',
  fillType2: '#383838',
  fillType3: '#424242',
  fillType4: '#4f4f4f',
  fillType5: '#5a5a5a',
  fillType6: '#676767',
  fillType7: '#737373',
  
  // Pie Chart (using a vibrant, dark-mode friendly palette)
  pie1: '#5470c6',  // From ECharts default dark
  pie2: '#91cc75',
  pie3: '#fac858',
  pie4: '#ee6666',
  pie5: '#73c0de',
  pie6: '#3ba272',
  pie7: '#fc8452',
  pie8: '#9a60b4',
  pie9: '#ea7ccc',
  pie10: '#46567a', // Darker shades for more slices
  pie11: '#6e8a5e',
  pie12: '#8b6f3a',
  pieStroke: '#e0e0e0',
  pieOuterStroke: '#e0e0e0',
  pieOpacity: '0.9', // Slight transparency can look good in dark mode
  pieTitleTextSize: '18px',
  pieTitleTextColor: '#e0e0e0',
  pieSectionTextSize: '14px',
  pieSectionTextColor: '#e0e0e0',
  pieLegendTextSize: '14px',
  pieLegendTextColor: '#e0e0e0',

  // Quadrant Chart
  quadrant1Fill: '#2a2a2a',
  quadrant2Fill: '#383838',
  quadrant3Fill: '#424242',
  quadrant4Fill: '#4f4f4f',
  quadrant1Text: '#e0e0e0',
  quadrant2Text: '#e0e0e0',
  quadrant3Text: '#e0e0e0',
  quadrant4Text: '#e0e0e0',
  quadrantPointFill: '#e0e0e0',    // Light points
  quadrantPointText: '#1e1e1e',    // Dark text on light points
  quadrantXAxisText: '#e0e0e0',
  quadrantYAxisText: '#e0e0e0',
  quadrantInternalBorder: '#b0b0b0',
  quadrantExternalBorder: '#e0e0e0',
  quadrantTitle: '#e0e0e0',

  // General application settings
  fontSize: '14px',
  fontFamily: 'sans-serif',
  // background: '#121212', // App's actual background, distinct from mermaid's mainBkg. This should match your CSS.
}; 