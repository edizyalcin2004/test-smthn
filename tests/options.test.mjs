import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleChoice, selectionError, comparable, basketRequest } from '../src/lib/options.js';
import { openOrderLink, safeOrderURL } from '../src/lib/orderLinks.js';
const child={id:2,name:'Extra',min_select:1,max_select:1,may_skip_without_input:false,choices:[{id:3,name:'Cheese',available:true,child_groups:[]}]};
const group={id:1,name:'Size',min_select:1,max_select:1,may_skip_without_input:false,
 choices:[{id:1,name:'Small',available:true,child_groups:[]},{id:2,name:'Large',available:true,child_groups:[child]}]};
test('changing parent clears inactive descendants',()=>{
 assert.deepEqual(toggleChoice([2,3],group,group.choices[0]),[1]);
 assert.match(selectionError([group],[2]),/Extra/);
 assert.equal(selectionError([group],[2,3]),null);
 assert.match(selectionError([group],[1,3]),/yeniden/);
});
test('unknown choice and inferred optionality are never defaulted',()=>{
 assert.deepEqual(toggleChoice([],group,{...group.choices[0],available:false}),[]);
 assert.match(selectionError([{...group,min_select:0}],[]),/gerekli/);
});
test('one source is sent and unavailable totals cannot rank',()=>{
 assert.deepEqual(basketRequest([{item:{id:4,name:'Meal'},qty:2,sourceConfiguration:{platform_id:1,option_item_ids:[2,3]}}]),
 [{id:4,name:'Meal',qty:2,source_configuration:{platform_id:1,option_item_ids:[2,3]}}]);
 assert.equal(comparable({available:false,total:'10',items:[{found:true,price:'10'}]}),false);
 assert.equal(comparable({total:'10',items:[{found:true,price:'10'}]}),false);
 assert.equal(comparable({available:true,total:'10',items:[{found:true,price:'10'}]}),true);
});
test('safe external URLs only; no basket or guessed scheme',async()=>{
 for(const url of ['javascript:alert(1)','getir://x','https://getir.com.evil.test','https://a@getir.com','http://getir.com'])assert.equal(safeOrderURL(url),null);
 const opened=[];
 assert.equal(await openOrderLink('https://getir.com/',async url=>opened.push(url)),true);
 assert.deepEqual(opened,['https://getir.com/']);
 assert.equal(await openOrderLink('https://getir.com/',async()=>{throw Error('no handler');}),false);
});
test('hidden active groups cannot be saved',()=>{
 assert.match(selectionError([{...group,shown:false}],[1]),/doğrulanamıyor/);
});
