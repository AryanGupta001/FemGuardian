const fs = require('fs');
const { createCanvas } = require('canvas');

const icons = {
  home: {
    regular: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L4 9V21H20V9L12 3Z" stroke="#808080" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 21V12H15V21" stroke="#808080" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    active: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L4 9V21H20V9L12 3Z" stroke="#e91e63" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 21V12H15V21" stroke="#e91e63" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  chat: {
    regular: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.5 21L5.89944 20.3229C6.28392 20.22 6.69121 20.2791 7.04753 20.4565C8.38842 21.1244 9.90034 21.5 11.5 21.5" stroke="#808080" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 12H16" stroke="#808080" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 16H12" stroke="#808080" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    active: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.5 21L5.89944 20.3229C6.28392 20.22 6.69121 20.2791 7.04753 20.4565C8.38842 21.1244 9.90034 21.5 11.5 21.5" stroke="#e91e63" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 12H16" stroke="#e91e63" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 16H12" stroke="#e91e63" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  location: {
    regular: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" stroke="#808080" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    active: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" stroke="#e91e63" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  voice: {
    regular: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z" stroke="#808080" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10" stroke="#808080" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    active: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z" stroke="#e91e63" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10" stroke="#e91e63" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  }
};

// Create a canvas for each icon
Object.entries(icons).forEach(([name, { regular, active }]) => {
  // Regular icon
  const canvas = createCanvas(24, 24);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 24, 24);
  
  // Save regular icon
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`${name}.png`, buffer);
  
  // Save active icon
  const activeBuffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`${name}-active.png`, activeBuffer);
}); 