import { Route } from '@/types';
import got from '@/utils/got';
import { parseDate } from '@/utils/parse-date';

const typeMap = {
    30: '产品发布',
    31: '技术变更',
    29: '其他公告',
};

/**
 *
 * @param ctx {import('koa').Context}
 */
export const route: Route = {
    path: '/open/notice/:cateId?',
    categories: ['programming'],
    example: '/xiaohongshu/open/notice',
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
  | 产品发布    | 30         |
  | 技术变更    | 31         |
  | 其他公告    | 29         |`,
};

async function handler(ctx) {
    const cateId = ctx.req.param('cateId') ? Number.parseInt(ctx.req.param('cateId')) : -1;
    const response = await got({
        method: 'post',
        url: 'https://open.xiaohongshu.com/api/announcement/getAllAnnouncementDetailNew',
        json: {
            pageNo: 1,
            pageSize: 20,
            announcementId: cateId,
        },
    });

    const result = response.data.data.announcementDetails.map((item) => ({
        title: item.title,
        link: `https://open.xiaohongshu.com/platformSupport/notice/${cateId}/${item.itemId}`,
        description: item.content,
        pubDate: parseDate(item.updateTime),
    }));

    return {
        title: `唯品会开放平台 - ${typeMap[cateId] || '所有公告'}`,
        link: `https://open.xiaohongshu.com/platformSupport/notice/${cateId}`,
        item: result,
    };
}
