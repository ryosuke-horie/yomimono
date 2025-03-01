# Drizzleのスキーマ定義

SQLiteの構文が前提となる。以下は構文のサンプル。実装にはひきづらないこと。
```
import { sqliteTable, integer } from "drizzle-orm/sqlite-core"
export const users = sqliteTable('users', {
  id: integer()
});
```

SQLiteにはスキーマの概念がないので、単一のSQLiteファイルコンテキスト内でのみテーブルを定義できます。
```
import { sqliteTable as table } from "drizzle-orm/sqlite-core";
import * as t from "drizzle-orm/sqlite-core";
import { AnySQLiteColumn } from "drizzle-orm/sqlite-core";

export const users = table(
  "users",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    firstName: t.text("first_name"),
    lastName: t.text("last_name"),
    email: t.text().notNull(),
    invitee: t.int().references((): AnySQLiteColumn => users.id),
    role: t.text().$type<"guest" | "user" | "admin">().default("guest"),
  },
  (table) => [
    t.uniqueIndex("email_idx").on(table.email)
  ]
);

export const posts = table(
  "posts",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    slug: t.text().$default(() => generateUniqueString(16)),
    title: t.text(),
    ownerId: t.int("owner_id").references(() => users.id),
  },
  (table) => [
    t.uniqueIndex("slug_idx").on(table.slug),
    t.index("title_idx").on(table.title),
  ]
);

export const comments = table("comments", {
  id: t.int().primaryKey({ autoIncrement: true }),
  text: t.text({ length: 256 }),
  postId: t.int("post_id").references(() => posts.id),
  ownerId: t.int("owner_id").references(() => users.id),
});
```

# drizzleクエリ

Querying
Relational queries are an extension to Drizzle’s original query builder. You need to provide all tables and relations from your schema file/files upon drizzle() initialization and then just use the db.query API.

drizzle import path depends on the database driver you’re using.
```
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/...';
const db = drizzle({ schema });
await db.query.users.findMany(...);

// if you have schema in multiple files
import * as schema1 from './schema1';
import * as schema2 from './schema2';
import { drizzle } from 'drizzle-orm/...';
const db = drizzle({ schema: { ...schema1, ...schema2 } });
await db.query.users.findMany(...);
```

Drizzle provides .findMany() and .findFirst() APIs.

Find many
```
const users = await db.query.users.findMany();

// result type
const result: {
	id: number;
	name: string;
	verified: boolean;
	invitedBy: number | null;
}[];
```

Find first
.findFirst() will add limit 1 to the query.
```
const user = await db.query.users.findFirst();

// result type
const result: {
	id: number;
	name: string;
	verified: boolean;
	invitedBy: number | null;
};
```

Include relations
With operator lets you combine data from multiple related tables and properly aggregate results.

Getting all posts with comments:

```
const posts = await db.query.posts.findMany({
	with: {
		comments: true,
	},
});
```

Getting first post with comments:
```
const post = await db.query.posts.findFirst({
	with: {
		comments: true,
	},
});
```

You can chain nested with statements as much as necessary.
For any nested with queries Drizzle will infer types using Core Type API.

Get all users with posts. Each post should contain a list of comments:
```
const users = await db.query.users.findMany({
	with: {
		posts: {
			with: {
				comments: true,
			},
		},
	},
});
```
Partial fields select
columns parameter lets you include or omit columns you want to get from the database.

Drizzle performs partial selects on the query level, no additional data is transferred from the database.

Keep in mind that a single SQL statement is outputted by Drizzle.

Get all posts with just id, content and include comments:
```
const posts = await db.query.posts.findMany({
	columns: {
		id: true,
		content: true,
	},
	with: {
		comments: true,
	}
});
```
Get all posts without content:
```
const posts = await db.query.posts.findMany({
	columns: {
		content: false,
	},
});
```

When both true and false select options are present, all false options are ignored.

If you include the name field and exclude the id field, id exclusion will be redundant, all fields apart from name would be excluded anyways.

Exclude and Include fields in the same query:
```
const users = await db.query.users.findMany({
	columns: {
		name: true,
		id: false //ignored
	},
});

// result type
const users: {
	name: string;
};

Only include columns from nested relations:

const res = await db.query.users.findMany({
	columns: {},
	with: {
		posts: true
	}
});

// result type
const res: {
	posts: {
		id: number,
		text: string
	}
}[];
```

Nested partial fields select
Just like with partial select, you can include or exclude columns of nested relations:
```
const posts = await db.query.posts.findMany({
	columns: {
		id: true,
		content: true,
	},
	with: {
		comments: {
			columns: {
				authorId: false
			}
		}
	}
});
```

Select filters
Just like in our SQL-like query builder, relational queries API lets you define filters and conditions with the list of our operators.

You can either import them from drizzle-orm or use from the callback syntax:
```
import { eq } from 'drizzle-orm';
const users = await db.query.users.findMany({
	where: eq(users.id, 1)
})

const users = await db.query.users.findMany({
	where: (users, { eq }) => eq(users.id, 1),
})
```

Find post with id=1 and comments that were created before particular date:
```
await db.query.posts.findMany({
	where: (posts, { eq }) => (eq(posts.id, 1)),
	with: {
		comments: {
			where: (comments, { lt }) => lt(comments.createdAt, new Date()),
		},
	},
});
```

Limit & Offset
Drizzle ORM provides limit & offset API for queries and for the nested entities.

Find 5 posts:
```
await db.query.posts.findMany({
	limit: 5,
});

Find posts and get 3 comments at most:

await db.query.posts.findMany({
	with: {
		comments: {
			limit: 3,
		},
	},
});
```

IMPORTANT
offset is only available for top level query.
```
await db.query.posts.findMany({
	limit: 5,
	offset: 2, // correct ✅
	with: {
		comments: {
			offset: 3, // incorrect ❌
			limit: 3,
		},
	},
});
```

Find posts with comments from the 5th to the 10th post:

```
await db.query.posts.findMany({
	limit: 5,
  offset: 5,
	with: {
		comments: true,
	},
});
```

Order By
Drizzle provides API for ordering in the relational query builder.

You can use same ordering core API or use order by operator from the callback with no imports.
```
import { desc, asc } from 'drizzle-orm';
await db.query.posts.findMany({
	orderBy: [asc(posts.id)],
});

await db.query.posts.findMany({
	orderBy: (posts, { asc }) => [asc(posts.id)],
});
```

Order by asc + desc:
```
await db.query.posts.findMany({
	orderBy: (posts, { asc }) => [asc(posts.id)],
	with: {
		comments: {
			orderBy: (comments, { desc }) => [desc(comments.id)],
		},
	},
});
```

Include custom fields
Relational query API lets you add custom additional fields. It’s useful when you need to retrieve data and apply additional functions to it.

IMPORTANT
As of now aggregations are not supported in extras, please use core queries for that.
```
import { sql } from 'drizzle-orm';
await db.query.users.findMany({
	extras: {
		loweredName: sql`lower(${users.name})`.as('lowered_name'),
	},
})

await db.query.users.findMany({
	extras: {
		loweredName: (users, { sql }) => sql`lower(${users.name})`.as('lowered_name'),
	},
})
```

lowerName as a key will be included to all fields in returned object.

IMPORTANT
You have to explicitly specify .as("<name_for_column>")

To retrieve all users with groups, but with the fullName field included (which is a concatenation of firstName and lastName), you can use the following query with the Drizzle relational query builder.
```
const res = await db.query.users.findMany({
	extras: {
		fullName: sql<string>`concat(${users.name}, " ", ${users.name})`.as('full_name'),
	},
	with: {
		usersToGroups: {
			with: {
				group: true,
			},
		},
	},
});

// result type
const res: {
	id: number;
	name: string;
	verified: boolean;
	invitedBy: number | null;
	fullName: string;
	usersToGroups: {
			group: {
					id: number;
					name: string;
					description: string | null;
			};
	}[];
}[];
```

To retrieve all posts with comments and add an additional field to calculate the size of the post content and the size of each comment content:

```
const res = await db.query.posts.findMany({
	extras: (table, { sql }) => ({
		contentLength: (sql<number>`length(${table.content})`).as('content_length'),
	}),
	with: {
		comments: {
			extras: {
				commentSize: sql<number>`length(${comments.content})`.as('comment_size'),
			},
		},
	},
});

// result type
const res: {
	id: number;
	createdAt: Date;
	content: string;
	authorId: number | null;
	contentLength: number;
	comments: {
			id: number;
			createdAt: Date;
			content: string;
			creator: number | null;
			postId: number | null;
			commentSize: number;
	}[];
};
```

Prepared statements
Prepared statements are designed to massively improve query performance

In this section, you can learn how to define placeholders and execute prepared statements using the Drizzle relational query builder.

Placeholder in where
```
const prepared = db.query.users.findMany({
	where: ((users, { eq }) => eq(users.id, placeholder('id'))),
	with: {
		posts: {
			where: ((users, { eq }) => eq(users.id, 1)),
		},
	},
}).prepare();
const usersWithPosts = await prepared.execute({ id: 1 });
```

Placeholder in limit
```
const prepared = db.query.users.findMany({
	with: {
		posts: {
			limit: placeholder('limit'),
		},
	},
}).prepare();
const usersWithPosts = await prepared.execute({ limit: 1 });
```

Placeholder in offset
```
const prepared = db.query.users.findMany({
	offset: placeholder('offset'),
	with: {
		posts: true,
	},
}).prepare();
const usersWithPosts = await prepared.execute({ offset: 1 });
```

Multiple placeholders
```
const prepared = db.query.users.findMany({
	limit: placeholder('uLimit'),
	offset: placeholder('uOffset'),
	where: ((users, { eq, or }) => or(eq(users.id, placeholder('id')), eq(users.id, 3))),
	with: {
		posts: {
			where: ((users, { eq }) => eq(users.id, placeholder('pid'))),
			limit: placeholder('pLimit'),
		},
	},
}).prepare();
const usersWithPosts = await prepared.execute({ pLimit: 1, uLimit: 3, uOffset: 1, id: 2, pid: 6 });
```