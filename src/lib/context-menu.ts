// Update the addArrowKeyNavigation call to use a more specific selector
// around line 635 in src/lib/context-menu.ts

addArrowKeyNavigation(event, '.menu > .menu-section > .menu-item:not(.context-submenu-trigger)');