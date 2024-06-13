import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import dayjs from 'dayjs';
import timezone from '@/utils/timezone';

const typeMap = {
    '1': '业务动态',
    '2': '技术动态',
    '3': '规则变更',
    '4': '其他公告',
};

/**
 *
 * @param ctx {import('koa').Context}
 */
export const route: Route = {
    path: '/announcement/:cateId?',
    categories: ['programming'],
    example: '/kwaixiaodian/announcement',
    parameters: { cateId: '公告分类, 可在页面URL获取' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: '平台公告',
    maintainers: ['zhijunchai'],
    handler,
    description: `| 类型       | type       |
  | ---------- | ---------- |
  | 所有公告    |            |
  | 业务动态    | 1          |
  | 技术动态    | 2          |
  | 规则变更    | 3          |
  | 其他公告    | 4          |`,
};

async function handler(ctx) {
    const cateId = ctx.req.param('cateId') ? ctx.req.param('cateId') : 'all';
    const url = `https://open.kwaixiaodian.com/rest/open/platform/doc/page/list?docType=1&location=0&docCatalogId=${cateId === 'all' ? '' : cateId}&pageNum=1&pageSize=10`;
    const response = await got({ method: 'get', url });

    const list = response.data.data.list.map((item) => ({
        title: item.docPageName,
        pageSign: item.pageSign,
        link: `https://open.kwaixiaodian.com/zone/new/announcement/detail?cateId=${cateId}&pageSign=${item.pageSign}`,
        pubDate: timezone(dayjs(item.updateTime).format('YYYY-MM-DD HH:mm:ss'), +8),
    }));

    const result = await Promise.all(
        list.map((item) =>
            cache.tryGet(item.link, async () => {
                const url = `https://open.kwaixiaodian.com/rest/open/platform/doc/page/detail?pageSign=${item.pageSign}`;
                const itemResponse = await got({ method: 'get', url });
                item.description = itemResponse.data.data.docPageContent;
                return item;
            })
        )
    );

    return {
        title: `快手电商开放平台 - ${typeMap[cateId] ?? '所有公告'}`,
        link: `https://open.kwaixiaodian.com/zone/new/announcement/list?cateId=${cateId}`,
        item: result,
    };
}
