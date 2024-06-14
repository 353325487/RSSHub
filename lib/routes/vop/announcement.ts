import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { parseDate } from '@/utils/parse-date';
import timezone from '@/utils/timezone';

/**
 *
 * @param ctx {import('koa').Context}
 */
export const route: Route = {
    path: '/announcement/:cateId?',
    categories: ['programming'],
    example: '/vop/announcement',
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
    maintainers: ['blade0910'],
    handler,
    description: `| 类型       | type       |
  | ---------- | ---------- |
  | 所有公告    |            |
  | 安全公告    | 4          |
  | 技术变更    | 1          |
  | 规则变更    | 2          |
  | 维护公告    | 4          |
  | 日常通知    | 6          |`,
};

async function handler(ctx) {
    const cateId = ctx.req.param('cateId') ? Number.parseInt(ctx.req.param('cateId')) : 0;
    const url = `https://vop.vip.com/api/announcement/list?categoryId=${cateId}`;
    const response = await got({ method: 'get', url });

    const cacheKey = 'vop:announcement:cate';
    const cateMap = await cache.tryGet(cacheKey, async () => {
        const resp = await got({
            method: 'get',
            url: 'https://vop.vip.com/api/announcement/category/list',
        });
        const arr = {};
        if (resp.data.data) {
            for (const item of resp.data.data) {
                arr[item.id] = item.title;
            }
        }
        return arr;
    });

    const list = response.data.data.map((item) => ({
        title: item.title,
        id: item.id,
        link: `https://vop.vip.com/home#/announcement/detail/${item.id}`,
        pubDate: timezone(parseDate(item.updateTime), +8),
    }));

    const result = await Promise.all(
        list.map((item) =>
            cache.tryGet(item.link, async () => {
                const url = `https://vop.vip.com/api/announcement/get?id=${item.id}`;
                const itemResponse = await got({ method: 'get', url });
                item.description = itemResponse.data.data.content;
                return item;
            })
        )
    );

    return {
        title: `唯品会开放平台 - ${cateMap ? cateMap[cateId] || '所有公告' : '所有公告'}`,
        link: `https://vop.vip.com/home#/announcement/${cateId}`,
        item: result,
    };
}
