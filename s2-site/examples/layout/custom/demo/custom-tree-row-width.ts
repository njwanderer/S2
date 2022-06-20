import { PivotSheet } from '@antv/s2';

fetch(
  'https://gw.alipayobjects.com/os/bmw-prod/2a5dbbc8-d0a7-4d02-b7c9-34f6ca63cff6.json',
)
  .then((res) => res.json())
  .then((dataCfg) => {
    const container = document.getElementById('container');

    // 详情请查看: https://s2.antv.vision/zh/docs/manual/advanced/custom/cell-size
    const s2Options = {
      width: 600,
      height: 480,
      hierarchyType: 'tree',
      style: {
        treeRowsWidth: 200,
      },
    };

    const s2 = new PivotSheet(container, dataCfg, s2Options);
    s2.render();
  });