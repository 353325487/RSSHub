import { Route } from '@/types';
import got from '@/utils/got';
import { parseDate } from '@/utils/parse-date';
import timezone from '@/utils/timezone';
import dayjs from 'dayjs';

const typeMap = {
    '1': '活动公告',
    '2': '技术变更',
    '3': '规则变更',
    '4': '产品发布',
    '5': '处罚公告',
};

/**
 *
 * @param ctx {import('koa').Context}
 */
export const route: Route = {
    path: '/announcement/:type?',
    categories: ['programming'],
    example: '/pinduoduo/announcement',
    parameters: { type: '公告分类, 可在页面URL获取' },
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
  | 活动公告    | 1          |
  | 技术变更    | 2          |
  | 规则变更    | 3          |
  | 产品发布    | 4          |
  | 处罚公告    | 5          |`,
};

async function handler(ctx) {
    const type = ctx.req.param('type') ? Number.parseInt(ctx.req.param('type')) : -1;
    const createdAtEnd = dayjs().add(2, 'year').unix() * 1000;
    const response = await got({
        method: 'post',
        url: 'https://open-api.pinduoduo.com/doc/announcement/list',
        json: {
            createdAtEnd,
            createdAtStart: 0,
            id: 0,
            pageIndex: 0,
            pageSize: 10,
            platform: -1,
            publishedAtEnd: createdAtEnd,
            publishedAtStart: 0,
            status: -1,
            type,
        },
    });

    const result = response.data.result.announcementList.map((item) => ({
        title: item.theme,
        link: `https://open.pinduoduo.com/application/document/announcement?id=${item.id}`,
        description: item.content,
        pubDate: timezone(parseDate(item.publishedAt), +8),
    }));

    return {
        title: `拼多多开放平台 - ${typeMap[type] ?? '所有公告'}`,
        link: `https://open.pinduoduo.com/application/document/announcement?type=${type}`,
        item: result,
    };
}
