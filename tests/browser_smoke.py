import json,threading,http.server,functools,sys
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright,expect
root=Path(sys.argv[1] if len(sys.argv)>1 else 'dist-web').resolve()
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
posts=[];errors=[]
rest={'id':1,'slug':'popeyes','name':'Popeyes','cuisine_type':'Tavuk','logo_url':None}
plat={'id':1,'name':'Migros Yemek','hex_color':'#ff6600'}
tree={'menu_item_id':10,'status':'configurable','reference_platform':plat,'fresh_platforms':['Migros Yemek'],'groups':[
 {'id':1,'name':'Sandviç','min':1,'max':1,'parent_option_id':None,'options':[{'id':101,'name':'Tavukburger'},{'id':102,'name':'XL Sandviç'}]},
 {'id':2,'name':'Sos','min':1,'max':1,'parent_option_id':102,'options':[{'id':201,'name':'Ketçap'},{'id':202,'name':'Ranch'}]}]}
def route(r):
 u=urlparse(r.request.url)
 if u.hostname=='127.0.0.1':r.continue_();return
 if u.hostname!='pryce-backend-production.up.railway.app':r.abort();return
 path=u.path;body=None
 if r.request.method=='OPTIONS':r.fulfill(status=200,headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'});return
 if r.request.method=='POST':
  body=r.request.post_data_json;posts.append((path,body))
 if path in ('/discount-codes','/special-deals'):out=[]
 elif path in ('/search','/restaurants'):out=[rest]
 elif path=='/menu':out=[{'id':10,'name':'Burger Menü','category':'Menüler','price':'100'},{'id':11,'name':'Unavailable Menü','category':'Menüler','price':'99'}]
 elif path=='/menu-items/10/options':out=tree
 elif path=='/menu-items/11/options':out={'menu_item_id':11,'status':'options_unavailable','groups':[]}
 elif path=='/compare-basket':
  assert body['items'][0]['options']=={'platform_id':1,'choices':[102,202]},body
  out=[{'platform':plat,'items':[{'name':'Burger Menü','found':True,'price':'135','options_status':'priced'}],'total':'135','order_url':'https://www.migros.com.tr/yemek','order_link_kind':'platform'},
       {'platform':{'id':2,'name':'Tıklagelsin'},'items':[{'name':'Burger Menü','found':False,'price':None,'options_status':'options_unavailable'}],'total':'0'}]
 elif path in ('/events','/order-feedback'):out={'ok':True,'stored':1}
 else:raise AssertionError(path)
 r.fulfill(status=201 if path in ('/events','/order-feedback') else 200,content_type='application/json',headers={'Access-Control-Allow-Origin':'*'},body=json.dumps(out))
try:
 with sync_playwright() as pw:
  browser=pw.firefox.launch(headless=True);page=browser.new_page(viewport={'width':430,'height':932},device_scale_factor=1)
  page.set_default_timeout(8000);page.route('**/*',route);page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script('window.open=(url)=>{window.lastOpened=url;return null;}')
  page.goto(f'http://127.0.0.1:{server.server_port}');page.get_by_text('Karşılaştırmaya başla',exact=True).click()
  page.get_by_placeholder('Restoran, yemek veya mutfak…').fill('Popeyes')
  page.get_by_text('Popeyes',exact=True).last.click()
  with page.expect_response('**/menu-items/11/options'):
   page.get_by_text('Unavailable Menü',exact=True).click()
  expect(page.get_by_text('ürün · Sepeti incele',exact=True)).to_have_count(0)
  page.get_by_text('Burger Menü',exact=True).click()
  save=page.get_by_role('button',name='Sepete ekle');expect(save).to_be_disabled()
  page.get_by_role('radio',name='XL Sandviç',exact=True).click();expect(save).to_be_disabled()
  page.get_by_role('radio',name='Ranch',exact=True).click();expect(save).to_be_enabled();save.click()
  page.get_by_text('ürün · Sepeti incele',exact=True).click()
  page.get_by_text('Fiyatları karşılaştır',exact=True).click()
  expect(page.get_by_text('Bu sepet için yalnızca bir platformda doğrulanmış fiyat var.',exact=True)).to_be_visible()
  expect(page.get_by_text('Burger Menü: bu seçeneklerle karşılaştırılamıyor',exact=True)).to_be_visible()
  page.screenshot(path=str(root.parent/'mobile-results.png'))
  page.get_by_role('link',name='Platformu aç · Migros Yemek').click()
  page.wait_for_function("localStorage.getItem('pryce.pendingOrder.v1') !== null")
  page.evaluate("() => {let p=JSON.parse(localStorage.getItem('pryce.pendingOrder.v1'));p.at=Date.now()-60000;localStorage.setItem('pryce.pendingOrder.v1',JSON.stringify(p));}")
  page.reload();expect(page.get_by_text('Siparişini tamamladın mı?',exact=True)).to_be_visible()
  page.get_by_role('radio',name='Fiyat farklıydı',exact=True).click();expect(page.get_by_role('button',name='Evet',exact=True)).to_be_disabled()
  page.get_by_label('Ödediğin tutar',exact=True).fill('160,00')
  page.wait_for_timeout(400)  # allow the modal fade to settle before visual evidence
  page.screenshot(path=str(root.parent/'mobile-order-confirm.png'))
  page.get_by_role('button',name='Evet',exact=True).click()
  page.wait_for_function("localStorage.getItem('pryce.pendingOrder.v1') === null")
  order=page.evaluate("JSON.parse(localStorage.getItem('pryce.orders.v1'))[0]")
  assert order['paid']==160 and order['saved']==0 and order['matched'] is False,order
  page.reload();expect(page.get_by_text('Siparişini tamamladın mı?',exact=True)).to_have_count(0)
  assert not errors,errors
  assert any(path=='/order-feedback' and body['paid']==160 for path,body in posts)
  print(json.dumps({'browser':'Firefox','configured_choices':[102,202],'incomplete_platform_unranked':True,'actual_paid':order['paid'],'saved':order['saved'],'repeat_popup':False,'page_errors':errors,'api':'local fixtures only; no production POSTs'}))
  browser.close()
except Exception:
 print('ERRORS',errors)
 raise
finally:server.shutdown()
