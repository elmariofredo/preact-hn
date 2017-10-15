export const ITEMS_PER_PAGE = 30;

interface Lists {
  top: any;
  new: any;
  show: any;
  ask: any;
  job: any;
}
export type LIST_TYPES = keyof Lists;

/*
Usage: 
type Foo = {
  [P in keyof LIST_TYPES]: string;
}
*/

//export type LIST_TYPES = 'top' | 'new' | 'show' | 'ask' | 'job';
