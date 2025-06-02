PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO d1_migrations VALUES(1,'0000_tired_major_mapleleaf.sql','2025-04-13 12:13:18');
INSERT INTO d1_migrations VALUES(2,'0001_closed_layla_miller.sql','2025-04-13 12:13:18');
INSERT INTO d1_migrations VALUES(3,'0002_dry_edwin_jarvis.sql','2025-04-13 12:13:18');
INSERT INTO d1_migrations VALUES(4,'0003_joyous_adam_destine.sql','2025-05-03 13:15:18');
INSERT INTO d1_migrations VALUES(5,'0004_woozy_zemo.sql','2025-05-18 07:18:57');
INSERT INTO d1_migrations VALUES(6,'0005_stormy_shinko_yamashiro.sql','2025-05-18 07:18:57');
INSERT INTO d1_migrations VALUES(7,'0006_lumpy_nomad.sql','2025-05-24 03:45:29');
INSERT INTO d1_migrations VALUES(8,'0007_tricky_bucky.sql','2025-06-01 23:12:22');
INSERT INTO d1_migrations VALUES(9,'0008_eager_revanche.sql','2025-06-02 05:19:36');
CREATE TABLE `article_ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer NOT NULL,
	`practical_value` integer NOT NULL,
	`technical_depth` integer NOT NULL,
	`understanding` integer NOT NULL,
	`novelty` integer NOT NULL,
	`importance` integer NOT NULL,
	`total_score` integer NOT NULL,
	`comment` text,
	`created_at` integer DEFAULT '"2025-06-02T05:18:59.283Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-06-02T05:18:59.283Z"' NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS "article_labels" (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer NOT NULL,
	`label_id` integer NOT NULL,
	`created_at` integer DEFAULT '"2025-06-02T05:18:59.283Z"' NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS "bookmarks" (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT '"2025-06-02T05:18:59.282Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-06-02T05:18:59.282Z"' NOT NULL
);
INSERT INTO bookmarks VALUES(23,'https://zenn.dev/laiso/articles/b09637e4d744f3','Roo CodeとClineはどう違うのか',1,1740859326,1740982503);
INSERT INTO bookmarks VALUES(24,'https://zenn.dev/laiso/articles/ae259902fe7c5c','200行のTypeScriptでmin-clineを実装する',1,1740859326,1740982859);
INSERT INTO bookmarks VALUES(25,'https://dev.to/composiodev/claude-37-sonnet-vs-grok-3-vs-o3-mini-high-coding-comparison-23oe','Claude 3.7 Sonnet vs. Grok 3 vs. o3-mini-high: Coding comparison - DEV Community',1,1740859326,1740985155);
INSERT INTO bookmarks VALUES(26,'https://dev.to/wynandpieters/ai-tools-are-we-replacing-skills-or-enhancing-them-28n','AI Tools: Are We Replacing Skills or Enhancing Them? (and at what cost) - DEV Community',1,1740859326,1740985331);
INSERT INTO bookmarks VALUES(27,'https://zenn.dev/rikika/articles/d65e6e676e890d','Cursor活用で開発生産性を最大化するTips',1,1740859326,1740987412);
INSERT INTO bookmarks VALUES(28,'https://zenn.dev/ryoyoshii/articles/c810d2fa9f7769','SRE こそ OpenHands 使ってみな 飛ぶぞ',1,1740859326,1740987416);
INSERT INTO bookmarks VALUES(29,'https://dev.to/pratham_naik_project_manager/why-do-developers-struggle-with-productivity-10-proven-ways-to-fix-it-1mjb','Why Do Developers Struggle with Productivity? 10 Proven Ways to Fix It - DEV Community',1,1740859326,1741437722);
INSERT INTO bookmarks VALUES(30,'https://qiita.com/sigma_devsecops/items/cd420bd54cbbe1c40cc0','「Clineに全部賭ける」勇気がでないのでGitHub Copilot Agentでお安く試してみる #生成AI - Qiita',1,1740859326,1740987420);
INSERT INTO bookmarks VALUES(31,'https://findy-tools.io/products/new-relic/4/147','New Relicの導入効果をレビューでご紹介(Cut-株式会社エアークローゼット)',1,1740859326,1741150290);
INSERT INTO bookmarks VALUES(32,'https://qiita.com/DifyJapan/items/c9818705cb2182c2cf2d','Dify v1.0.0: プラグインエコシステム始動、AI開発の新時代を切り拓く #LLM - Qiita',1,1740859326,1741437723);
INSERT INTO bookmarks VALUES(33,'https://findy-tools.io/','Findy Tools',1,1740859326,1740956692);
INSERT INTO bookmarks VALUES(34,'https://tech.acesinc.co.jp/entry/2025/02/28/080000','「徹底的にパクる」で開発生産性を最大化！他社の知見を活かす方法 - ACES エンジニアブログ',1,1740859326,1741437751);
INSERT INTO bookmarks VALUES(36,'https://github.com/mizchi/ailab','mizchi/ailab',1,1740926830,1741086851);
INSERT INTO bookmarks VALUES(37,'https://zenn.dev/laiso/articles/ae259902fe7c5c','200行のTypeScriptでmin-clineを実装する',1,1740926830,1740987704);
INSERT INTO bookmarks VALUES(38,'https://speakerdeck.com/minorun365/aiezientoru-men','AIエージェント入門 - Speaker Deck',1,1740926830,1740987730);
INSERT INTO bookmarks VALUES(39,'https://blog.syum.ai/entry/2025/03/01/235814','Go 1.24で入ったGo製ツールの管理機能が便利だったのでおすすめしたい - 焼売飯店',1,1740926830,1741443352);
INSERT INTO bookmarks VALUES(40,'https://zenn.dev/laiso/articles/b09637e4d744f3','Roo CodeとClineはどう違うのか',1,1740926830,1740987440);
INSERT INTO bookmarks VALUES(41,'https://speakerdeck.com/yoshidashingo/20250301-agentic-ai-engineering','AIエージェント時代のエンジニアになろう #jawsug #jawsdays2025 / 20250301 Agentic AI Engineering - Speaker Deck',1,1740926830,1740987861);
INSERT INTO bookmarks VALUES(42,'https://blog.cloudflare.com/build-ai-agents-on-cloudflare/','Making Cloudflare the best platform for building AI Agents',1,1740926830,1741149282);
INSERT INTO bookmarks VALUES(43,'https://voluntas.ghost.io/try-cline/','Cline 試してみた',1,1740926830,1740987499);
INSERT INTO bookmarks VALUES(44,'https://speakerdeck.com/uhyo/react-19atupudetonotamenibi-yao-nakoto','React 19アップデートのために必要なこと - Speaker Deck',1,1740926830,1741437753);
INSERT INTO bookmarks VALUES(45,'https://speakerdeck.com/recruitengineers/iosdc-takahashi-ishii','レガシーなプロダクトからドメイン層を再設計する / iOSDC_takahashi_ishii - Speaker Deck',1,1740926830,1741443353);
INSERT INTO bookmarks VALUES(46,'https://t-wada.hatenablog.jp/entry/canon-tdd-by-kent-beck','【翻訳】テスト駆動開発の定義 - t-wadaのブログ',1,1740926830,1741443355);
INSERT INTO bookmarks VALUES(47,'https://github.com/siyuan-note/siyuan','siyuan-note/siyuan: A privacy-first, self-hosted, fully open source personal knowledge management software, written in typescript and golang.',1,1740926830,1741443472);
INSERT INTO bookmarks VALUES(48,'https://github.com/bregman-arie/devops-exercises','bregman-arie/devops-exercises: Linux, Jenkins, AWS, SRE, Prometheus, Docker, Python, Ansible, Git, Kubernetes, Terraform, OpenStack, SQL, NoSQL, Azure, GCP, DNS, Elastic, Network, Virtualization. DevOps Interview Questions',1,1740926830,1741443622);
INSERT INTO bookmarks VALUES(49,'https://fullswing.dena.com/archives/100153/','DeNA南場智子が語る「AI時代の会社経営と成長戦略」全文書き起こし | フルスイング by DeNA',1,1740926830,1741443714);
INSERT INTO bookmarks VALUES(50,'https://zenn.dev/knowledgework/articles/ff066e9e949e71?redirected=1','ゼロから検索エンジニアになるまで',1,1740926830,1741442874);
INSERT INTO bookmarks VALUES(51,'https://zenn.dev/canary_techblog/articles/e13273faba2bea','バックエンド出身エンジニアがReact/Next.jsに入門してみた話',1,1740926830,1741443756);
INSERT INTO bookmarks VALUES(52,'https://www.docswell.com/s/tyonekubo/5R2Y4E-architecture2design','Architecture to Design より良い設計を目指して | ドクセル',1,1740926830,1741444113);
INSERT INTO bookmarks VALUES(53,'https://speakerdeck.com/taishiyade/oqian-moaigui-ninaranaika-bolt-and-cursor-and-supabase-and-vercelderen-jian-woyameruzo-ziyoziyo','お前もAI鬼にならないか？👹Bolt & Cursor & Supabase & Vercelで人間をやめるぞ、ジョジョー！👺 - Speaker Deck',1,1740926830,1741448602);
INSERT INTO bookmarks VALUES(54,'https://zenn.dev/ks0318/articles/108ab4f9f086ef','CursorとSupabaseのDBをMCP経由で繋いでみた（Windsurfも可）',1,1740926830,1741489867);
INSERT INTO bookmarks VALUES(55,'https://speakerdeck.com/yasuoyasuo/15jbugguang-dao-number-15fa-biao-zi-liao','エンジニアのためのドキュメント力基礎講座〜構造化思考から始めよう〜（2025/02/15jbug広島#15発表資料） - Speaker Deck',1,1740926830,1741490183);
INSERT INTO bookmarks VALUES(56,'https://speakerdeck.com/cremacrema/adobe-max-japan-2025-shang-shou-nifireflynioyuan-isiteuebudezainan-wochu-suzo','【Adobe MAX Japan 2025】上手にFireflyにお願いしてウェブデザイン案を出すぞ！ - Speaker Deck',1,1740926830,1741490606);
INSERT INTO bookmarks VALUES(57,'https://speakerdeck.com/ynojima/sabasaidokai-fa-zhe-notamenopasukiru-men','サーバーサイド開発者のためのパスキー入門 - Speaker Deck',1,1740926830,1741490623);
INSERT INTO bookmarks VALUES(58,'https://github.blog/ai-and-ml/github-copilot/how-to-refactor-code-with-github-copilot/','How to refactor code with GitHub Copilot - The GitHub Blog',1,1740926830,1741490755);
INSERT INTO bookmarks VALUES(59,'https://debimate.jp/2025/02/13/%E3%80%90golang%E3%80%91fe3dback-go-arch-lint%E3%81%A7%E3%82%A2%E3%83%BC%E3%82%AD%E3%83%86%E3%82%AF%E3%83%81%E3%83%A3%E3%81%AE%E7%A0%B4%E5%A3%8A%E3%82%92%E9%98%B2%E3%81%90/','【Golang】fe3dback/go-arch-lintでアーキテクチャの破壊を防ぐ',1,1740926830,1741490852);
INSERT INTO bookmarks VALUES(60,'https://note.com/maki_23/n/n067052f03cf1','Notion導入後6年の活用状況を語る｜maki',1,1740926830,1741490869);
INSERT INTO bookmarks VALUES(61,'https://speakerdeck.com/kanmo/how-mixi2-uses-tidb-for-sns-scalability-and-performance','How mixi2 Uses TiDB for SNS Scalability and Performance - Speaker Deck',1,1740926830,1741490922);
INSERT INTO bookmarks VALUES(62,'https://zenn.dev/ks0318/articles/6023a5b729cb7a','CursorとWindsurfを約1ヶ月弱併用して分かったそれぞれの特徴 | 比較',1,1740926830,1741490949);
INSERT INTO bookmarks VALUES(63,'https://laiso.hatenablog.com/entry/2025/02/15/214756','SpecStory：コーディングエージェントに記憶を持たせたい人々 - laiso',1,1740926830,1741490982);
INSERT INTO bookmarks VALUES(64,'https://pivotmedia.co.jp/movie/12564','ChatGPT新機能「DeepResearch」は月３万の価値はあるか？ - PIVOT',1,1740926830,1741490986);
INSERT INTO bookmarks VALUES(65,'https://zenn.dev/koichi_51/articles/29f502f24e4986','Cursor で PR の作成から Golden Test まで実装する',1,1740926830,1741491008);
INSERT INTO bookmarks VALUES(66,'https://blog.inductor.me/entry/2025/02/14/011532','自分の知識をアップデートすることと、クラウド事業のありかたに関する自分なりの言語化 - inductor''s blog',1,1740926830,1741491058);
INSERT INTO bookmarks VALUES(67,'https://speakerdeck.com/yotii23/rubytozi-you-toaito','Rubyと自由とAIと - Speaker Deck',1,1740926830,1741491093);
INSERT INTO bookmarks VALUES(68,'https://note.com/kmagai/n/n9c78650645f9','AIをシステム開発に活かすコツ、全部書く｜kmagai',1,1740926830,1741491927);
INSERT INTO bookmarks VALUES(69,'https://cursor.directory/rust-async-development-rules','Rust Async Programming Development Rules rule by Sheng-Yan, Zhang',1,1740926830,1741491930);
INSERT INTO bookmarks VALUES(70,'https://zenn.dev/discus0434/articles/6e5add61970786','Xに頼らずAI関連情報をキャッチアップする',1,1740926830,1740982039);
INSERT INTO bookmarks VALUES(71,'https://zenn.dev/mizchi/articles/ai-ddd-tdd-prompt','自分のコーディングスタイル(TDD/DDD/FP)をAIに叩き込む',1,1740926830,1741622940);
INSERT INTO bookmarks VALUES(72,'https://zenn.dev/suthio/scraps/2b3bff900cf0c9','ailabベースで使っている際の便利ツールたち',1,1740926830,1741622861);
INSERT INTO bookmarks VALUES(73,'https://yunix-kyopro.hatenablog.com/entry/2025/01/16/204053','ビジュアライザ筋トレ2025年 chatGPT活用編 - yunix_kyopro’s blog',1,1740926830,1741621521);
INSERT INTO bookmarks VALUES(74,'https://findy-tools.io/products/sentry/22/268','フロントエンドからバックエンドまで一貫してSentryを活用',1,1740981796,1741621672);
INSERT INTO bookmarks VALUES(75,'https://findy-tools.io/products/sentry/22/123','自社に適した運用でフロントエンドのエラーを迅速に対応することを実現',1,1740981796,1741621606);
INSERT INTO bookmarks VALUES(76,'https://findy-tools.io/products/sentry/22/44','Sentryの導入効果をレビューでご紹介(アセンド株式会社-丹羽健)',1,1740981796,1741622329);
INSERT INTO bookmarks VALUES(77,'https://zenn.dev/nicox/articles/b6affdfeca1acf','【AI×競馬】5つのサービスのDeep Researchで予想してみた実験レポート',1,1740981796,1741621477);
INSERT INTO bookmarks VALUES(78,'https://findy-tools.io/products/sentry/22/291','Sentry活用によるエラー監視の効率化',1,1740981796,1741622330);
INSERT INTO bookmarks VALUES(79,'https://findy-tools.io/products/sentry/22/54','導入の障壁が低く始めやすいエラー監視の定番ツール',1,1740981796,1741622556);
INSERT INTO bookmarks VALUES(80,'https://findy-tools.io/products/sentry/22/45','スタートアップに必要十分な機能と手頃な価格の監視ツール',1,1740981796,1741622558);
INSERT INTO bookmarks VALUES(81,'https://findy-tools.io/products/sentry/22/65','気軽に検討から導入までできるエラー監視ツール',1,1740981796,1741622559);
INSERT INTO bookmarks VALUES(82,'https://zenn.dev/razokulover/articles/768337f838a110','Cline+Claudeでの開発を試してみた感想',1,1741086386,1741622754);
INSERT INTO bookmarks VALUES(83,'https://dev.to/falkordb/langchain-falkordb-building-ai-agents-with-memory-191','LangChain + FalkorDB: Building AI Agents with Memory - DEV Community',1,1741086386,1741622755);
INSERT INTO bookmarks VALUES(84,'https://zenn.dev/shunta/articles/20250303-62d62f8561916f','Claude 3.7 & RooCode でコーディングエージェントを試してみた',1,1741086386,1741622756);
INSERT INTO bookmarks VALUES(85,'https://zenn.dev/tomoikey/articles/ab2b065bdf334c','メモリと仲良しになろう！[超入門編]',1,1741086386,1741622862);
INSERT INTO bookmarks VALUES(86,'https://dev.to/sruthi177/why-i-started-learning-automation-devops-5130','🚀 Why I Started Learning Automation & DevOps - DEV Community',1,1741086386,1741622863);
INSERT INTO bookmarks VALUES(87,'https://dev.to/tom_greenwald/the-future-of-e2e-testing-how-to-overcome-flakiness-with-natural-language-llms-2h5','The Future of E2E Testing: How to Overcome Flakiness with Natural Language + LLMs - DEV Community',1,1741086386,1741622962);
INSERT INTO bookmarks VALUES(88,'https://qiita.com/ynmc0214/items/0a3ed437eeea02ccdefd','web開発素人だけど、Claude 3.7 Sonnetを使ったら半日でアプリ開発&リリースできた記念記事 #個人開発 - Qiita',1,1741086386,1741622981);
INSERT INTO bookmarks VALUES(89,'https://findy-tools.io/products/vertexai/396/405','Vertex AI Pipelinesの効率的な開発、運用の取り組み',1,1741086386,1741623025);
INSERT INTO bookmarks VALUES(90,'https://findy-tools.io/products/devin/399/415','株式会社DeskrexのDevin導入事例',1,1741086386,1741827778);
INSERT INTO bookmarks VALUES(91,'https://findy-tools.io/products/cloudflare/23/419','開発環境のアクセス制限を柔軟かつセキュアにしてくれたCloudflare Access',1,1741086386,1741827779);
INSERT INTO bookmarks VALUES(92,'https://findy-tools.io/products/vertexai/396/412','Vertex AI Online Predictionを使用した ONEのレシート情報抽出モデルのサービング',1,1741086386,1741827779);
INSERT INTO bookmarks VALUES(93,'https://findy-tools.io/products/playwright/33/413','PlaywrightとStorybookの連携試行記',1,1741086386,1741827780);
INSERT INTO bookmarks VALUES(94,'https://findy-tools.io/products/playwright/33/373','Playwright導入によるテストサイクルの効率化',1,1741086386,1741827781);
INSERT INTO bookmarks VALUES(95,'https://tech.iimon.co.jp/entry/2025/03/04/145452','優秀なエンジニアは何が違う？ - iimon TECH BLOG',1,1741086386,1741827781);
INSERT INTO bookmarks VALUES(96,'https://blog.smartbank.co.jp/entry/2025/03/04/best-workplace-for-engineers','"お金を扱うエンジニアリング"がもたらす知的興奮と成長、 あるいはキャリア停滞の打破 - inSmartBank',1,1741086386,1741827782);
INSERT INTO bookmarks VALUES(97,'https://note.com/ashizawakamome/n/nf5527d097287','Roo Code (Roo Cline)のメモリバンクを応用して最新鋭のAI小説執筆を体験しよう！｜葦沢かもめ',1,1741086386,1741827783);
INSERT INTO bookmarks VALUES(98,'https://zenn.dev/watany/articles/50665ee40f4948','$100燃やして分かったClineのTips',1,1741086386,1741827784);
INSERT INTO bookmarks VALUES(99,'https://note.com/kiiita/n/n41f0437b6d62','Clineと仲良く付き合うためのTipsをメモしておく｜kiiita',1,1741086386,1741827785);
INSERT INTO bookmarks VALUES(100,'https://zenn.dev/knowledgesense/articles/fe155b25510683','RAGで人間の脳を再現する',1,1741086386,1741827786);
INSERT INTO bookmarks VALUES(101,'https://findy-tools.io/products/langfuse/397/396','Langfuseを導入してLLMアプリケーション開発を劇的に進化させる',1,1741086386,1741827787);
INSERT INTO bookmarks VALUES(102,'https://zenn.dev/razokulover/articles/768337f838a110','Cline+Claudeでの開発を試してみた感想',1,1741086386,1741838439);
INSERT INTO bookmarks VALUES(103,'https://zenn.dev/hiruno_tarte/articles/how-to-use-oxlint','oxlint で eslint を高速化させる',1,1741086386,1741827792);
INSERT INTO bookmarks VALUES(104,'https://levtech.jp/media/article/interview/detail_626/','“選定してすぐにダメになった”を防ぐには？特定の言語にフルベットしない、一休の技術戦略 | レバテックラボ（レバテックLAB）',1,1741086386,1741838440);
INSERT INTO bookmarks VALUES(105,'https://github.blog/ai-and-ml/github-copilot/how-to-debug-code-with-github-copilot/','How to debug code with GitHub Copilot - The GitHub Blog',1,1741086386,1741838441);
INSERT INTO bookmarks VALUES(106,'https://zenn.dev/sui_water/articles/ccabcfc16596b0','HonoXで短縮URL作成サイトをつくる',1,1741086386,1741838442);
INSERT INTO bookmarks VALUES(107,'https://code.visualstudio.com/docs/copilot/workspace-context#_managing-the-workspace-index','Making Copilot Chat an expert in your workspace',1,1741086386,1741912199);
INSERT INTO bookmarks VALUES(108,'https://zenn.dev/watany/articles/85af6cfb8dccb2','わざわざ言語化されないClineのコツ',1,1741308604,1741912200);
INSERT INTO bookmarks VALUES(109,'https://debimate.jp/2025/02/13/%E3%80%90golang%E3%80%91fe3dback-go-arch-lint%E3%81%A7%E3%82%A2%E3%83%BC%E3%82%AD%E3%83%86%E3%82%AF%E3%83%81%E3%83%A3%E3%81%AE%E7%A0%B4%E5%A3%8A%E3%82%92%E9%98%B2%E3%81%90/','【Golang】fe3dback/go-arch-lintでアーキテクチャの破壊を防ぐ',1,1741308604,1742271075);
INSERT INTO bookmarks VALUES(110,'https://jser.info/2025/03/06/typescript-5.8erasablesyntaxonly-next.js-15.2-lynx/','2025-03-06のJS: TypeScript 5.8(erasableSyntaxOnly)、Next.js 15.2、Lynx - JSer.info',1,1741308604,1742271076);
INSERT INTO bookmarks VALUES(111,'https://zenn.dev/hiruno_tarte/articles/how-to-use-oxlint','oxlint で eslint を高速化させる',1,1741308604,1741912191);
INSERT INTO bookmarks VALUES(112,'https://speakerdeck.com/soudai/abstraction-and-concretization','抽象化をするということ - 具体と抽象の往復を身につける / Abstraction and concretization - Speaker Deck',1,1741308604,1742271076);
INSERT INTO bookmarks VALUES(113,'https://karaage.hatenadiary.jp/entry/2025/03/05/073000','色々なことをClineにやらせてみた - karaage. [からあげ]',1,1741308604,1741912204);
INSERT INTO bookmarks VALUES(114,'https://konifar-zatsu.hatenadiary.jp/entry/2021/07/28/155844','抽象的な期待を自分ですり合わせるスキル - Konifar''s ZATSU',1,1741308604,1742271077);
INSERT INTO bookmarks VALUES(115,'https://www.jiang.jp/posts/20250303_how_cline_works/','Cline - AIのコーディングアシスタントの仕組みを徹底解説 – blog',1,1741308604,1741912209);
INSERT INTO bookmarks VALUES(116,'https://zenn.dev/cybozu_ept/articles/productivity-weekly-20250219','GitHub の破壊的変更多め、Tasklist が使えなくなるなど ｜Productivity Weekly(2025-02-19)',1,1741308604,1742271077);
INSERT INTO bookmarks VALUES(117,'https://speakerdeck.com/sony_haruki_matsuno/finops-nokao-ewobesunisitaji-sok-de-nakosutogai-shan-noqu-rizu-mi-5730bd62-aaa9-4a63-9e6b-23cf5914f774','FinOpsの考えをベースにした継続的なコスト改善の取り組み - Speaker Deck',1,1741308604,1742271078);
INSERT INTO bookmarks VALUES(118,'https://www.himaratsu.com/posts/n8muxxoi92','ひとつのテーマを深く学ぶ | Feedback Loop',1,1741308604,1742271079);
INSERT INTO bookmarks VALUES(119,'https://techbookfest.org/product/fTjJ7QSwZLxTCKmtiWv3Jp?productVariantID=uUHQRiuf7M3YNPjAsTGzTV','MySQLの通信仕様をGo言語で理解する本：taumu',1,1741415776,1742271079);
INSERT INTO bookmarks VALUES(120,'https://pyama.fun/archives/6463','Goプロジェクトの“爆速”リファクタリングを実現する！ | pyama.fun',1,1741415776,1742384357);
INSERT INTO bookmarks VALUES(121,'https://zenn.dev/ubie_dev/articles/e9d68da8a88cf2','Go 製 CLI ツールにおける selfupdate の実装',1,1741415776,1742384358);
INSERT INTO bookmarks VALUES(122,'https://zenn.dev/vs_blog/articles/5d3196bdddf209','パッケージ間の依存をチェックする静的解析ツール「go-depcheck」を作った',1,1741415776,1742384358);
INSERT INTO bookmarks VALUES(123,'https://quii.gitbook.io/learn-go-with-tests','Learn Go with Tests | Learn Go with tests',1,1741415776,1742384359);
INSERT INTO bookmarks VALUES(124,'https://zenn.dev/koya_iwamura/articles/ca9ab62ff760c2','Go1.24 New Features',1,1741415776,1742384360);
INSERT INTO bookmarks VALUES(125,'https://zenn.dev/ngicks/articles/go-basics-revisited-error-handling','Goのプラクティスまとめ: error handling',1,1741415776,1742384360);
INSERT INTO bookmarks VALUES(126,'https://zenn.dev/jcat/articles/323ce8b4e4744d','GoアプリのCI/CDを4倍高速化した汎用的手法まとめ【txdb】',1,1741415776,1742384361);
INSERT INTO bookmarks VALUES(127,'https://qiita.com/nakampany/items/0df035b365f6770a4d5b','【Go】sqlxからsqlcへの移行をしてから半年たった #AdventCalendar2024 - Qiita',1,1741415776,1742384362);
INSERT INTO bookmarks VALUES(128,'https://zenn.dev/ngicks/articles/go-basics-revisited-error-handling','Goのプラクティスまとめ: error handling',1,1741415776,1742587275);
INSERT INTO bookmarks VALUES(129,'https://speakerdeck.com/uji/gobiao-zhun-noan-hao-raihurari-mentenansuzhan-lue','Go標準の暗号ライブラリメンテナンス戦略 - Speaker Deck',1,1741415776,1742890978);
INSERT INTO bookmarks VALUES(130,'https://qiita.com/nakampany/items/0df035b365f6770a4d5b','【Go】sqlxからsqlcへの移行をしてから半年たった #AdventCalendar2024 - Qiita',1,1741415776,1742587272);
INSERT INTO bookmarks VALUES(131,'https://speakerdeck.com/utgwkk/kyoto-dot-go-number-56','ゆるやかにgolangci-lintのルールを強くする / Kyoto.go #56 - Speaker Deck',1,1741415776,1742591354);
INSERT INTO bookmarks VALUES(132,'https://kawasin73.hatenablog.com/entry/2023/08/05/223600','Rust で SQLite を再実装している - kawasin73のブログ',1,1741415776,1742599142);
INSERT INTO bookmarks VALUES(133,'https://speakerdeck.com/askua/tsnokodoworustdeshu-kizhi-sitahua','TSのコードをRustで書き直した話 - Speaker Deck',1,1741415776,1742599161);
INSERT INTO bookmarks VALUES(134,'https://qiita.com/suin/items/e2df562b0c2be7e2a123','2025年のReact状態管理、正直どれがいいの？ - Zustand, Jotai, Redux, Recoil, Valtio, XState, TanStack Query をざっくり解説 #redux - Qiita',1,1741415897,1742892302);
INSERT INTO bookmarks VALUES(135,'https://zenn.dev/yumemi_inc/articles/use-client-directive-explained-with-gssp','getServerSidePropsがわかれば''use client''がわかる',1,1741415897,1743393692);
INSERT INTO bookmarks VALUES(136,'https://speakerdeck.com/nofi/reacttesutohazime','Reactテストはじめ - Speaker Deck',1,1741415897,1741437054);
INSERT INTO bookmarks VALUES(137,'https://speakerdeck.com/sansantech/20241223-3','React Routerで実現する型安全なSPAルーティング - Speaker Deck',1,1741415897,1743467013);
INSERT INTO bookmarks VALUES(138,'https://tech.hello.ai/entry/2024/12/2/incremental-migration-nextjs','Next.jsからSPAに移行し、Next.jsに戻した話 - Hello Tech',1,1741415897,1743037830);
INSERT INTO bookmarks VALUES(139,'https://tech.hello.ai/entry/2024/12/2/incremental-migration-nextjs','Next.jsからSPAに移行し、Next.jsに戻した話 - Hello Tech',1,1741415897,1743039076);
INSERT INTO bookmarks VALUES(140,'https://speakerdeck.com/uhyo/react-19-plus-jotaiwoshi-siteqi-duita-zhu-yi-dian','React 19 + Jotaiを試して気づいた注意点 - Speaker Deck',1,1741415897,1741437051);
INSERT INTO bookmarks VALUES(141,'https://speakerdeck.com/uhyo/react-19-plus-jotaiwoshi-siteqi-duita-zhu-yi-dian','React 19 + Jotaiを試して気づいた注意点 - Speaker Deck',1,1741415897,1743558195);
INSERT INTO bookmarks VALUES(142,'https://zenn.dev/uhyo/articles/file-download-from-web-api','フロントエンドからファイルをダウンロードさせるやり方について',1,1741415897,1743558197);
INSERT INTO bookmarks VALUES(143,'https://speakerdeck.com/mugi_uno/baseline-ha-iizo','令和7年版 あなたが使ってよいフロントエンド機能とは - Speaker Deck',1,1741415897,1741437041);
INSERT INTO bookmarks VALUES(144,'https://zenn.dev/uhyo/articles/file-download-from-web-api','フロントエンドからファイルをダウンロードさせるやり方について',1,1741415897,1741437042);
INSERT INTO bookmarks VALUES(145,'https://speakerdeck.com/mugi_uno/baseline-ha-iizo','令和7年版 あなたが使ってよいフロントエンド機能とは - Speaker Deck',1,1741415897,1743068978);
INSERT INTO bookmarks VALUES(146,'https://speakerdeck.com/mugi_uno/baseline-ha-iizo','令和7年版 あなたが使ってよいフロントエンド機能とは - Speaker Deck',1,1741415897,1741437039);
INSERT INTO bookmarks VALUES(147,'https://speakerdeck.com/nofi/reacttesutohazime','Reactテストはじめ - Speaker Deck',1,1741415897,1743068912);
INSERT INTO bookmarks VALUES(148,'https://zenn.dev/yumemi_inc/articles/use-client-directive-explained-with-gssp','getServerSidePropsがわかれば''use client''がわかる',1,1741415897,1743068915);
INSERT INTO bookmarks VALUES(149,'https://x.com/i/grok?conversation=1898345695159222760','Grok / X',1,1741436956,1741437035);
INSERT INTO bookmarks VALUES(150,'https://calendar.google.com/calendar/u/0/r/tasks','Google カレンダー - ToDo リスト',1,1741436956,1741437034);
INSERT INTO bookmarks VALUES(151,'https://syu-m-5151.hatenablog.com/entry/2025/03/07/133504?','無限技術的負債 - Taming Your Dragon: Addressing Your Technical Debt の読書感想文 - じゃあ、おうちで学べる',1,1741485387,1743065597);
INSERT INTO bookmarks VALUES(152,'https://zenn.dev/farstep/articles/optimistic-and-pessimistic-locking-in-database','データベースの楽観ロックと悲観ロックを理解する',1,1741487895,1743039087);
INSERT INTO bookmarks VALUES(153,'https://zenn.dev/schottman13/articles/47cfc83e2c6950','Go モジュールを雰囲気で使っている人のためのFAQ【Go 1.23.6時点】',1,1741487895,1743558199);
INSERT INTO bookmarks VALUES(154,'https://zenn.dev/yosh1/articles/mastra-ai-agent-framework-guide','Mastra入門 〜AIエージェント開発ツールの概要と使い方〜',1,1741487895,1743039067);
INSERT INTO bookmarks VALUES(155,'https://qiita.com/ikemura-ren/items/75e59d7466c372fe7bf0','一度は触れてほしい、ターミナルが美しいと思えるツール5選+α #Linux - Qiita',1,1741487895,1743065791);
INSERT INTO bookmarks VALUES(156,'https://zenn.dev/codeciao/articles/cline-mcp-server-overview','MCPで広がるLLM　~Clineでの動作原理~',1,1741487895,1741912237);
INSERT INTO bookmarks VALUES(157,'https://zenn.dev/ncdc/articles/7807f5b6e3ee88','GitHub Copilotがプルリクを勝手にレビューしてくれる設定を広めたい',1,1741487895,1741912238);
INSERT INTO bookmarks VALUES(158,'https://qiita.com/uist1idrju3i/items/30012cf52bd0b9af3408','OpenBlinkが公開されました #OpenBlink - Qiita',1,1741487895,1743039090);
INSERT INTO bookmarks VALUES(159,'https://qiita.com/ikuro_mori/items/f428bd207f5588ee3305','Mistral OCR API を使って PDF からテキストを抽出する #Python - Qiita',1,1741487895,1743558199);
INSERT INTO bookmarks VALUES(160,'https://zenn.dev/gemcook/articles/weekly-cloudflare_2025_0223-0301','週刊Cloudflare - 2025/02/23週',1,1741487895,1742008591);
INSERT INTO bookmarks VALUES(161,'https://tech.acesinc.co.jp/entry/2025/03/07/083000','エンジニアがPdM領域に踏み込む挑戦 - 10%ルールの実践と学び - - ACES エンジニアブログ',1,1741487895,1741727083);
INSERT INTO bookmarks VALUES(162,'https://zenn.dev/bellwood4486/articles/workstations','ローカル・リモートお好きにどうぞな、HRBrainのマイクロサービス開発環境',1,1741489788,1743038924);
INSERT INTO bookmarks VALUES(163,'https://blog.lai.so/firebender-coding-agent-for-intellij/','Firebender: ついに登場したIntelliJプラグイン版コーディングエージェント',1,1741489788,1743558200);
INSERT INTO bookmarks VALUES(164,'https://speakerdeck.com/twada/why-the-clean-architecture-does-not-fit-with-web-frontend','The Clean ArchitectureがWebフロントエンドでしっくりこないのは何故か / Why The Clean Architecture does not fit with Web Frontend - Speaker Deck',1,1741489788,1743558202);
INSERT INTO bookmarks VALUES(165,'https://speakerdeck.com/horai93/full-stack-cloudflare-wokrers-at-workers-tech-talks-in-osaka-2025','Full Stack Cloudflare Wokrers_at_Workers Tech Talks in Osaka_2025 - Speaker Deck',1,1741489788,1741726944);
INSERT INTO bookmarks VALUES(166,'https://www.m3tech.blog/entry/2025/03/07/142214','複雑なドメイン知識を身につける7つの方法 - エムスリーテックブログ',1,1741489788,1741726945);
INSERT INTO bookmarks VALUES(167,'https://speakerdeck.com/codehex/orewojiu-tuta-cline-woshao-jie-suru','オレを救った Cline を紹介する - Speaker Deck',1,1741489788,1741726945);
INSERT INTO bookmarks VALUES(168,'https://zenn.dev/layerx/articles/9bdefe4d435882','Model Context Protocol の現在地',1,1741489788,1741726946);
INSERT INTO bookmarks VALUES(169,'https://syu-m-5151.hatenablog.com/entry/2025/03/09/020057','MCPでLLMに行動させる - Terraformを例とした tfmcp の紹介 - じゃあ、おうちで学べる',1,1741489788,1741726637);
INSERT INTO bookmarks VALUES(170,'https://zenn.dev/codeciao/articles/cline-mcp-server-overview','MCPで広がるLLM　~Clineでの動作原理~',1,1741489788,1741726640);
INSERT INTO bookmarks VALUES(171,'https://zenn.dev/woodstock_tech/articles/739fc1cb3b1ac5','Lynxを動かす：新世代クロスプラットフォーム開発ツールの第一印象',1,1741489788,1741726639);
INSERT INTO bookmarks VALUES(172,'https://scrummasudar.hatenablog.com/entry/2025/03/05/173724','「やる仕事が多くて人が足りない」場合に提案していること - スクラムマスダーの日記',1,1741489788,1741726640);
INSERT INTO bookmarks VALUES(173,'https://martinfowler.com/articles/2021-test-shapes.html','On the Diverse And Fantastical Shapes of Testing',1,1741846988,1742942892);
INSERT INTO bookmarks VALUES(174,'https://martinfowler.com/bliki/TestPyramid.html','Test Pyramid',1,1741846988,1742942899);
INSERT INTO bookmarks VALUES(175,'https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications','The Testing Trophy and Testing Classifications',1,1741846988,1742942901);
INSERT INTO bookmarks VALUES(176,'https://martinfowler.com/bliki/SubcutaneousTest.html','Subcutaneous Test',1,1741846988,1742942902);
INSERT INTO bookmarks VALUES(177,'https://zenn.dev/sakito/articles/7a7c2e0800cf69#%E3%82%B3%E3%83%B3%E3%83%9D%E3%83%BC%E3%83%8D%E3%83%B3%E3%83%88%E3%81%AE%E4%BB%95%E6%A7%98%E6%9B%B8','デザインシステムのStorybookとChromatic活用の紹介',1,1741846988,1742942903);
INSERT INTO bookmarks VALUES(178,'https://zenn.dev/overflow_offers/articles/20240209-testing-strategy','Web フロントエンドのテストと持続可能な方針の組み立てを考える | Offers Tech Blog',1,1741846988,1741913044);
INSERT INTO bookmarks VALUES(179,'https://golden-lucky.hatenablog.com/entry/2019/08/02/181821','Haskell 解説本 小史 - golden-luckyの日記',1,1741846988,1741913046);
INSERT INTO bookmarks VALUES(180,'https://speakerdeck.com/quramy/shang-shou-nifu-kihe-ukonponentotesuto','上手に付き合うコンポーネントテスト - Speaker Deck',1,1741846988,1741913045);
INSERT INTO bookmarks VALUES(181,'https://www.nngroup.com/articles/design-systems-101/','Design Systems 101',1,1741988693,1742942906);
INSERT INTO bookmarks VALUES(182,'https://zenn.dev/ryo_kawamata/articles/resume-on-github','GitHubの機能をフルに使って職務経歴書の継続的インテグレーションを実現する',1,1741988693,1742475226);
INSERT INTO bookmarks VALUES(183,'https://forest.watch.impress.co.jp/docs/news/1670239.html','Windows 10/11に「Noto」フォントが標準搭載へ ～日中韓のWebブラウジングが改善 - 窓の杜',1,1741988693,1742890861);
INSERT INTO bookmarks VALUES(184,'https://speakerdeck.com/ayame113/batukuendonode-dot-js-x-hurontoendodeno-dekai-fa-sitede-raretazhi-jian','バックエンドNode.js × フロントエンドDeno で開発して得られた知見 - Speaker Deck',1,1741988693,1742890837);
INSERT INTO bookmarks VALUES(185,'https://zenn.dev/mi_01_24fu/articles/missing-value-2025_03_14','欠損値ってなんやねん',1,1741988693,1742890716);
INSERT INTO bookmarks VALUES(186,'https://www.cloudnativemaster.com/post/quality-attributes-trade-offs','Quality Attributes & Trade-Offs | CloudNativeMaster | Dibyojyoti Sanyal',1,1741988693,1742942907);
INSERT INTO bookmarks VALUES(187,'https://cline.bot/blog/memory-bank-how-to-make-cline-an-ai-agent-that-never-forgets','Memory Bank: How to Make Cline an AI Agent That Never Forgets - Cline Blog',1,1741988693,1742942877);
INSERT INTO bookmarks VALUES(188,'https://developers.cloudflare.com/changelog/2025-03-11-process-env-support/','Access your Worker''s environment variables from process.env | Cloudflare Docs',1,1741988693,1742942909);
INSERT INTO bookmarks VALUES(189,'https://zenn.dev/takna/articles/mcp-server-tutorial-01-install','【MCPのトリセツ #1】MCPの概要と導入方法',1,1741988693,1742890575);
INSERT INTO bookmarks VALUES(190,'https://voluntas.ghost.io/duckdb-local-ui-released/','DuckDB Local UI が公開された',1,1741988693,1742890567);
INSERT INTO bookmarks VALUES(191,'https://speakerdeck.com/konifar/he-notamenoge-ren-mu-biao-she-ding','何のための個人目標設定？ - Speaker Deck',1,1741988693,1742783530);
INSERT INTO bookmarks VALUES(192,'https://speakerdeck.com/tasukulab280/gao-sekiyuriteigao-nai-zhang-hai-xing-sabusisutemuhua-sosite2yi-yuan','高セキュリティ・高耐障害性・サブシステム化。そして2億円 - Speaker Deck',1,1741988693,1742783527);
INSERT INTO bookmarks VALUES(193,'https://note.com/shnjtk/n/n086d6b7a22e3','エンジニアの目標設定に対する考え方 #日めくりLayerX｜shnjtk',1,1741988693,1742783528);
INSERT INTO bookmarks VALUES(194,'https://konifar-zatsu.hatenadiary.jp/entry/2016/05/05/002045','雑に思考をまとめたい - Konifar''s ZATSU',1,1741988693,1742777033);
INSERT INTO bookmarks VALUES(195,'https://speakerdeck.com/pyama86/shi-ye-wochai-bie-hua-suruji-shu-wosheng-michu-suji-shu','事業を差別化する技術を生み出す技術 - Speaker Deck',1,1741988693,1742777017);
INSERT INTO bookmarks VALUES(196,'https://speakerdeck.com/noteinc/enzinianokiyariapasuto-sonozhong-dezi-fen-gada-qie-nisiteirukoto','エンジニアのキャリアパスと、 その中で自分が大切にしていること - Speaker Deck',1,1741988693,1742776869);
INSERT INTO bookmarks VALUES(197,'https://zenn.dev/takna/articles/mcp-server-tutorial-09-markdownfy','【MCPのトリセツ #9】Markdownify MCP Server: WebページやPDFをMarkdown文書化',1,1741988693,1742589409);
INSERT INTO bookmarks VALUES(198,'https://speakerdeck.com/tomoyakitaura/wan-zhang-ru-wo-le-simu-nibian-huan-suruji-shu','「頑張る」を「楽しむ」に変換する技術 - Speaker Deck',1,1741988693,1742776658);
INSERT INTO bookmarks VALUES(199,'https://speakerdeck.com/mizutani/cloudsec-bestpractice-example','クラウドセキュリティのベストプラクティスと実装例 /cloudsec-bestpractice-example - Speaker Deck',1,1741988693,1742472328);
INSERT INTO bookmarks VALUES(200,'https://golangtokyo.connpass.com/event/348079/','golang.tokyo #38 - connpass',1,1741988693,1742776457);
INSERT INTO bookmarks VALUES(201,'https://speakerdeck.com/hanhan1978/how-not-to-survive','どうすると生き残れないのか/how-not-to-survive - Speaker Deck',1,1741988693,1742587259);
INSERT INTO bookmarks VALUES(202,'https://creators.spotify.com/pod/show/yowayowafm/episodes/Goosebolt-newChatGPT-Pro-e2vhtvb','Goose、bolt.new、ChatGPT Proが切り拓く次世代開発の未来 作成者：よわよわえふえむ',1,1741988693,1742783528);
INSERT INTO bookmarks VALUES(203,'https://chatgpt-lab.com/n/n8b229b02dd21','【週刊AI】中国発「Manus」がOpenAIを追撃 × Cursor評価額100億ドル交渉へ | #6 2025年3月3日~3月9日｜ChatGPT研究所',1,1741988693,1742472326);
INSERT INTO bookmarks VALUES(204,'https://zenn.dev/superstudio/articles/28ecc293bd2437','Cursorの知るべき10個のTips',1,1741989761,1742472327);
INSERT INTO bookmarks VALUES(205,'https://dev.to/vaidehi_adhi_84b623a30da7/is-plain-go-still-a-good-choice-in-2025-38la','Is plain Go Still a Good Choice in 2025? - DEV Community',1,1741989761,1742472337);
INSERT INTO bookmarks VALUES(206,'https://dev.to/andrew_moody_41/our-branching-strategy-lessons-learned-and-best-practices-54k','Our Branching Strategy: Lessons Learned and Best Practices - DEV Community',1,1741989761,1742472345);
INSERT INTO bookmarks VALUES(207,'https://zenn.dev/m10maeda/articles/my-favorite-architecture-blueprint','私のよく使うソフトウェアアーキテクチャの雛型',1,1741989761,1742472342);
INSERT INTO bookmarks VALUES(208,'https://zenn.dev/ukkz/articles/c8726063edd2cd','Cline任せでコード書いてたらAPIクレジットが爆散したのでClaude Desktop + MCPをいい感じにしてサブスクだけで無双する',1,1741989761,1742472342);
INSERT INTO bookmarks VALUES(209,'https://findy-tools.io/products/vertexai/396/430','推薦システムへのVertex AI Pipelinesの導入',1,1741989761,1742472335);
INSERT INTO bookmarks VALUES(210,'https://findy-tools.io/products/vertexai/396/414','LayerXにおけるVertex AI Pipelinesの導入と活用',1,1741989761,1742472334);
INSERT INTO bookmarks VALUES(211,'https://zenn.dev/smartcamp/articles/4b3e05623bf11e','Notionからmarkdownに変換するOSSを公開しました（Zennも対応）',1,1742270857,1742472333);
INSERT INTO bookmarks VALUES(212,'https://zenn.dev/jcat/articles/323ce8b4e4744d','GoアプリのCI/CDを4倍高速化した汎用的手法まとめ【txdb】',1,1742472392,1742776306);
INSERT INTO bookmarks VALUES(213,'https://qiita.com/nakampany/items/0df035b365f6770a4d5b','【Go】sqlxからsqlcへの移行をしてから半年たった #AdventCalendar2024 - Qiita',1,1742472392,1742587003);
INSERT INTO bookmarks VALUES(214,'https://quii.gitbook.io/learn-go-with-tests','Learn Go with Tests | Learn Go with tests',1,1742472392,1743818388);
INSERT INTO bookmarks VALUES(215,'https://creators.spotify.com/pod/show/yowayowafm/episodes/LLM-e306qb8','ローカルLLMの夢は夢のまま終わりそう 作成者：よわよわえふえむ',1,1742472392,1742545098);
INSERT INTO bookmarks VALUES(216,'https://zenn.dev/koya_iwamura/articles/ca9ab62ff760c2','Go1.24 New Features',1,1742472392,1742586842);
INSERT INTO bookmarks VALUES(217,'https://zenn.dev/ngicks/articles/go-basics-revisited-error-handling','Goのプラクティスまとめ: error handling',1,1742472392,1742586740);
INSERT INTO bookmarks VALUES(218,'https://zenn.dev/ivry/articles/dd7efbda415934','GitHubの権限とチームを整理してTerraform化した',1,1742486541,1742586604);
INSERT INTO bookmarks VALUES(219,'https://zenn.dev/reiwatravel/articles/796bc3ad8be2fb','スケールしてもお財布に優しいVercelのコストコントロール',1,1742486541,1742586438);
INSERT INTO bookmarks VALUES(220,'https://zenn.dev/oke331/articles/97d5de75f06fb3','【Cursor】FigmaにアクセスしてUIコードを自動生成！',1,1742486541,1742586344);
INSERT INTO bookmarks VALUES(221,'https://zenn.dev/dinii/articles/typescript-go','TypeScript の Go 移植に備えて知っておくべきこと',1,1742486541,1742585927);
INSERT INTO bookmarks VALUES(222,'https://zenn.dev/razokulover/articles/460a4fc30cc6de','自分がはてブした記事をPodcastにして配信する環境を作った',1,1742486541,1742545111);
INSERT INTO bookmarks VALUES(223,'https://zenn.dev/holy_fox/articles/ec4d803264b6df','【金欠学生向け】無料でもここまでできるフルスタック開発！',1,1742486541,1742545112);
INSERT INTO bookmarks VALUES(224,'https://zenn.dev/b13o/articles/about-playwright','Playwright でE2Eテストを始めるガイド【Next.js】',1,1742486541,1742545113);
INSERT INTO bookmarks VALUES(225,'https://zenn.dev/tsukulink/articles/8d38b8cfd4f5f1','Devinをお迎えした工夫、初稼働の成果、今後の展望',1,1742486541,1742545113);
INSERT INTO bookmarks VALUES(226,'https://zenn.dev/nabettu/articles/38f021c1901212','貧者のアークテクチャ：Next.js on Cloudflare Pages&WorkersのAPI側でFirestoreを使えるようにした',1,1742486541,1742545101);
INSERT INTO bookmarks VALUES(227,'https://zenn.dev/daichan132/articles/054a4803fdaa29','バズに頼らずChrome拡張機能のユーザー数1万人を達成する方法',1,1742486541,1742543070);
INSERT INTO bookmarks VALUES(228,'https://zenn.dev/su8/articles/9824d4d462c285','リードエンジニアとしてプロジェクト参画中にぼんやり意識していること',1,1742486541,1742542999);
INSERT INTO bookmarks VALUES(229,'https://zenn.dev/coefont/articles/0697fe7a6f3380','約3人でセキュリティ監査を乗り越えた話',1,1742486541,1742535347);
INSERT INTO bookmarks VALUES(230,'https://zenn.dev/knowledgework/articles/f82ac646cd09d6','1on1を劇的に改善！エンジニアの成長を加速する対話のコツ',1,1742486541,1742542801);
INSERT INTO bookmarks VALUES(231,'https://qiita.com/kumai_yu/items/0aa2fc294f8e1347e36c','AI駆動開発では「Project as Code」が超重要である！ #ChatGPT - Qiita',1,1742486541,1742538265);
INSERT INTO bookmarks VALUES(232,'https://qiita.com/uhyo/items/08f9b66db3cad73826ad','ReactとCSSで一定時間表示される通知をやるときの色々な方法 #React - Qiita',1,1742486541,1742538316);
INSERT INTO bookmarks VALUES(233,'https://zenn.dev/cloud_ace/articles/pte-meetup-2025','Google Cloud をもっと知ろう！Partner Top Engineer Meetup 2025',1,1742486541,1742523650);
INSERT INTO bookmarks VALUES(234,'https://zenn.dev/churadata/articles/5de07c1a6eefb4','今話題のAIエージェントについてまとめてみた',1,1742486541,1742523651);
INSERT INTO bookmarks VALUES(235,'https://tech.route06.co.jp/entry/2025/03/19/150000','GitHub リポジトリのメトリクスを GAS で継続的に蓄積する OSS リポジトリを公開した - ROUTE06 Tech Blog',1,1742486541,1742523651);
INSERT INTO bookmarks VALUES(236,'https://zenn.dev/chot/articles/f7c02e79e1f73b','GitHub Actions をローカルで実行！ nektos/act の紹介',1,1742486541,1742535266);
INSERT INTO bookmarks VALUES(237,'https://creatorzine.jp/news/detail/6404','日本デザインセンター、書く気分を高めるアプリ「stone」のコアエンジンをオープンソース化|CreatorZine│クリエイティブ×ITの情報でクリエイターを応援するウェブマガジン',1,1742486661,1742523648);
INSERT INTO bookmarks VALUES(238,'https://developers.cloudflare.com/changelog/2025-03-17-new-workers-ai-models/','New models in Workers AI | Cloudflare Docs',1,1742486661,1742523649);
INSERT INTO bookmarks VALUES(239,'https://speakerdeck.com/jsonf/18-making-security-scale-merukarigakao-erusekiyuriteizhan-lue-coincheck-x-layerx-x-mercari','2/18 Making Security Scale: メルカリが考えるセキュリティ戦略 - Coincheck x LayerX x Mercari - Speaker Deck',1,1742486661,1742523650);
INSERT INTO bookmarks VALUES(240,'https://speakerdeck.com/hinac0/aitoguo-gosusutatoatupuqanori-chang-towei-lai','AIと過ごすスタートアップQAの日常と未来 - Speaker Deck',1,1742486661,1742523650);
INSERT INTO bookmarks VALUES(241,'https://developers.cloudflare.com/pages/how-to/preview-with-cloudflare-tunnel/','Preview Local Projects with Cloudflare Tunnel · Cloudflare Pages docs',1,1742486661,1742523660);
INSERT INTO bookmarks VALUES(242,'https://speakerdeck.com/cocet33000/growing-stap-by-stap-zozo-backoffice-system-replacement','一歩ずつ成長しながら進める ZOZOの基幹システムリプレイス/Growing Stap by Stap ZOZO BackOffice System Replacement - Speaker Deck',1,1742486661,1742523656);
INSERT INTO bookmarks VALUES(243,'https://blog.lai.so/2025-03-14-intellijezientohayo-mcpbumu-clinedeyou-bu-pythonkararusthefan-yi/','2025-03-14: IntelliJエージェントはよ、MCPブーム、Clineで遊ぶ、PythonからRustへ翻訳',1,1742486661,1742523656);
INSERT INTO bookmarks VALUES(244,'https://pc.watch.impress.co.jp/docs/news/1670334.html','Google Meet、日本語でのAI文字起こし/議事録作成が可能に - PC Watch',1,1742486661,1742523653);
INSERT INTO bookmarks VALUES(245,'https://oss4.fun/episode/28/','28: オールドタイプなvimmerとAI (suzuken)',1,1742801127,1743558208);
INSERT INTO bookmarks VALUES(246,'https://speakerdeck.com/sakuraikotone/an-quan-nidao-siqie-ruririsuwosurutameni-15nian-lai-regasisisutemunohururipureisutiao-zhan-ji','安全に倒し切るリリースをするために：15年来レガシーシステムのフルリプレイス挑戦記 - Speaker Deck',1,1742801127,1742890508);
INSERT INTO bookmarks VALUES(247,'https://note.com/takanashi_ai/n/nb0be4ac7a38f','思考を整理！Notebook LMにマインドマップ機能が搭載。｜高梨洋平｜リサーチャー',1,1742801127,1742890078);
INSERT INTO bookmarks VALUES(248,'https://developers.cloudflare.com/agents/guides/remote-mcp-server/','Build a remote MCP server · Cloudflare Agents docs',1,1742801127,1742890085);
INSERT INTO bookmarks VALUES(249,'https://zenn.dev/tesla/articles/ade9883b2f62c9','Cursor / Clineを使う上でもっとも重要なことの一つ: コンテキストウインドウについて',1,1742801127,1742868530);
INSERT INTO bookmarks VALUES(250,'https://github.com/microsoft/vscode-docs/pull/8152/files','Copilot tips and tricks by ntrogh · Pull Request #8152 · microsoft/vscode-docs',1,1742801127,1742868531);
INSERT INTO bookmarks VALUES(251,'https://zenn.dev/kazuph/articles/5a6cc61ae21940','いつのまにか「Claude CodeをMCPサーバー化」してClaude Desktopから利用できる神機能が生えてた件について',1,1742801127,1742868498);
INSERT INTO bookmarks VALUES(252,'https://qiita.com/GOROman/items/a27ef7f3004de6ed18bb','自分をAIでもう一人作る？？Second-Meを試してみる① #SecondMe - Qiita',1,1742801438,1742868504);
INSERT INTO bookmarks VALUES(253,'https://zenn.dev/t3tra/articles/c293410c7daf63','Next.jsの脆弱性CVE-2025-29927まとめ',1,1742801438,1742868503);
INSERT INTO bookmarks VALUES(254,'https://zenn.dev/teba_eleven/articles/70beeb28d4791c','T3 Stackの環境構築 + めちゃくちゃ便利なセットアップ',1,1742801438,1742868506);
INSERT INTO bookmarks VALUES(255,'https://zenn.dev/yu_fukunaga/articles/try-secondme','Second Meを動かしてみた！AIによるセカンドブレイン構築への第一歩',1,1742801438,1742868508);
INSERT INTO bookmarks VALUES(256,'https://zenn.dev/neoai/articles/768b65f5655171','LLM x Slack x Notion で論文インプットを効率化し、社内ナレッジ蓄積もできるようにした話',1,1742801438,1742868518);
INSERT INTO bookmarks VALUES(257,'https://zenn.dev/mtshiba/articles/how-i-joined-astral','OSS活動してたらRuffの会社で働くことになった話',1,1742801438,1742868520);
INSERT INTO bookmarks VALUES(258,'https://qiita.com/rw_gtm/items/c53a67f805a01c636d02','経験談｜なぜ 27万行のC++コードを削除してまで、Rustでデータベースを書き直したのか？ #Database - Qiita',1,1742801438,1742868522);
INSERT INTO bookmarks VALUES(259,'https://qiita.com/GOROman/items/012c8d10da916ae6cad0','自分をAIでもう一人作る？？Second-Meを試してみる② #生成AI - Qiita',1,1742801438,1742868524);
INSERT INTO bookmarks VALUES(260,'https://qiita.com/suin/items/b71c8b5ae0ef63d04479','Next.jsのMiddlewareで認証している方はすぐに確認を！認可バイパス脆弱性（CVE-2025-29927）の解説と対策 #Next.js - Qiita',1,1742801438,1742868525);
INSERT INTO bookmarks VALUES(261,'https://chatgpt.com/c/67e2a86a-ce30-8002-b0cd-d56f346ddec8','UTCからJSTへの変換',1,1742909801,1742909847);
INSERT INTO bookmarks VALUES(262,'https://x.com/i/grok?conversation=1904526817966620762','Grok / X',1,1742909801,1742909849);
INSERT INTO bookmarks VALUES(263,'https://calendar.google.com/calendar/u/0/r/tasks?hl=ja','Google カレンダー - ToDo リスト',1,1742909801,1742909832);
INSERT INTO bookmarks VALUES(264,'https://calendar.google.com/calendar/u/0/r/tasks?hl=ja','Google カレンダー - ToDo リスト',1,1742909842,1742909850);
INSERT INTO bookmarks VALUES(265,'https://zenn.dev/dotdtech_blog/articles/dcaebb9d5024cc','Playwright MCPとCursorで、E2Eテストを自動生成してみた 〜AI×ブラウザ操作の新アプローチ〜',1,1743038475,1743039099);
INSERT INTO bookmarks VALUES(266,'https://dev.to/arindam_1729/i-built-an-ai-chatbot-with-hono-cloudflare-workers-nebius-ai-1c5h','I Built an AI Chatbot with Hono, Cloudflare Workers & Nebius AI! 🔥⚡ - DEV Community',1,1743038475,1743558825);
INSERT INTO bookmarks VALUES(267,'https://zenn.dev/huyu_kotori/articles/2025-03-24-kasukabe-tsumugi-copilot','GitHub Copilot を「せんぱい！」と慕ってくれる後輩ギャルにする',1,1743038475,1743039104);
INSERT INTO bookmarks VALUES(268,'https://dev.to/blizzerand/how-we-cut-our-ai-costs-by-80-without-losing-quality-1meo','How We Cut Our AI Costs by 80%—Without Losing Quality - DEV Community',1,1743038475,1743558828);
INSERT INTO bookmarks VALUES(269,'https://dev.to/web_dev-usman/here-how-to-build-a-chatbot-for-free-using-openrouter-and-deepseek-apis-492e','I have Built a Chatbot for Free Using OpenRouter and DeepSeek API - DEV Community',1,1743038475,1743558830);
INSERT INTO bookmarks VALUES(270,'https://dev.to/teamcamp/how-to-track-developer-productivity-without-micromanaging-1kdl?bb=219215','How to Track Developer Productivity Without Micromanaging - DEV Community',1,1743038475,1743558878);
INSERT INTO bookmarks VALUES(271,'https://dev.to/sunrabbit123/how-to-force-an-llm-to-output-json-493f','How to Force an LLM to Output JSON - DEV Community',1,1743038475,1743558879);
INSERT INTO bookmarks VALUES(272,'https://qiita.com/Nakamura-Kaito/items/1e6aabfa52911ab0ac5e','Cloudflareを活用したMCPサーバーデプロイ完全マニュアル ##MCP - Qiita',1,1743038475,1743648694);
INSERT INTO bookmarks VALUES(273,'https://qiita.com/Nakamura-Kaito/items/0e24e5a4e62a77647acc','【Claude】Playwright-MCPで変わるテスト自動化の世界！初心者でも使えるE2Eテスト入門 #apiテスト - Qiita',1,1743038475,1743038910);
INSERT INTO bookmarks VALUES(274,'https://tech.algomatic.jp/entry/2025/03/26/182954','"「生成AIこんなものか」と諦める前に" 営業AIエージェント開発現場から学ぶLLM品質保証テクニック - Algomatic Tech Blog',1,1743038475,1743653351);
INSERT INTO bookmarks VALUES(275,'https://www.lifull.blog/entry/2025/03/25/190000','改善活動: LCPの最適化 - LIFULL Creators Blog',1,1743038475,1743040554);
INSERT INTO bookmarks VALUES(276,'https://qiita.com/Nakamura-Kaito/items/bda2003313fa33f4d818','デザイン→実装を瞬時に！Figma-MCPが消す開発現場のストレス ##MCP - Qiita',1,1743038475,1743038908);
INSERT INTO bookmarks VALUES(277,'https://zenn.dev/ncdc/articles/90c6302a1b949a','LINE Notify終了の衝撃！LINE Works APIでBot移行を試みた顛末',1,1743038475,1743470340);
INSERT INTO bookmarks VALUES(278,'https://blog.smartbank.co.jp/entry/2025/03/25/090000','Hono + Deno で住所分割APIサーバーを2日で爆速実装する - inSmartBank',1,1743038475,1743815169);
INSERT INTO bookmarks VALUES(279,'https://tech.smarthr.jp/entry/2025/03/25/101612','Cloud CDN による画像配信の最適化 - SmartHR Tech Blog',1,1743038475,1743815719);
INSERT INTO bookmarks VALUES(280,'https://zenn.dev/karabiner_inc/articles/3b24a8e0df2982','エンジニアのための「めんどくさい」タスク攻略法',1,1743038475,1743816389);
INSERT INTO bookmarks VALUES(281,'https://tech.forstartups.com/entry/2025/03/24/080000','「この技術選定なんなん？」を無くす：ADRを始めてみた - for Startups Tech blog',1,1743038475,1743651964);
INSERT INTO bookmarks VALUES(282,'https://xstate.js.org/docs/about/concepts.html#finite-state-machines','Concepts | XState Docs',1,1743041568,1743754745);
INSERT INTO bookmarks VALUES(283,'https://www.brianstorti.com/the-actor-model/','The actor model in 10 minutes',1,1743041568,1743754747);
INSERT INTO bookmarks VALUES(284,'https://rafaelantunes.com.br/understanding-the-let-it-crash-philosophy','Understanding the "Let It Crash" philosophy',1,1743041568,1743651696);
INSERT INTO bookmarks VALUES(285,'https://blog.mookjp.io/blog-ja/let-it-crash-and-erlang/','Let It Crashとは何か - mookjp.io',1,1743041568,1743651698);
INSERT INTO bookmarks VALUES(286,'https://funcallfunc.com/programming/2017/02/21/let-it-crash.html','Let it crashについて « kaku''s blog',1,1743041568,1743651700);
INSERT INTO bookmarks VALUES(287,'https://qiita.com/soranoba/items/fce095f25c851dd34a6b','let it crashが生んだ誤解 #ポエム - Qiita',1,1743041568,1743651702);
INSERT INTO bookmarks VALUES(288,'https://www.freecodecamp.org/news/state-machines-basics-of-computer-science-d42855debc66/','Understanding State Machines',1,1743041568,1743754748);
INSERT INTO bookmarks VALUES(289,'https://en.wikipedia.org/wiki/Actor_model','Actor model - Wikipedia',1,1743041568,1743754749);
INSERT INTO bookmarks VALUES(290,'https://en.wikipedia.org/wiki/Finite-state_machine','Finite-state machine - Wikipedia',1,1743041568,1743754749);
INSERT INTO bookmarks VALUES(291,'https://en.wikipedia.org/wiki/Visitor_pattern','Visitor pattern - Wikipedia',1,1743041568,1743754750);
INSERT INTO bookmarks VALUES(292,'https://en.wikipedia.org/wiki/Tree_traversal','Tree traversal - Wikipedia',1,1743041568,1743754751);
INSERT INTO bookmarks VALUES(293,'https://github.com/syntax-tree/estree-util-visit','syntax-tree/estree-util-visit: esast (and estree) utility to visit nodes',1,1743041568,1743754752);
INSERT INTO bookmarks VALUES(294,'https://github.com/Rich-Harris/estree-walker','Rich-Harris/estree-walker: Traverse an ESTree-compliant AST',1,1743041568,1743754753);
INSERT INTO bookmarks VALUES(295,'https://unifiedjs.com/explore/package/unist-util-visit/','unist-util-visit - unified',1,1743041568,1743754754);
INSERT INTO bookmarks VALUES(296,'https://qiita.com/__sakito__/items/b1ef54fd6fb05c11e142','Babel Plugin を作りながら AST と Babel を学ぶ #JavaScript - Qiita',1,1743041568,1743123247);
INSERT INTO bookmarks VALUES(297,'https://kentcdodds.com/blog/write-tests','Write tests. Not too many. Mostly integration.',1,1743041568,1743754757);
INSERT INTO bookmarks VALUES(298,'https://kentcdodds.com/blog/confidently-shipping-code','Confidently Shipping Code',1,1743041568,1743754758);
INSERT INTO bookmarks VALUES(299,'https://kentcdodds.com/blog/static-vs-unit-vs-integration-vs-e2e-tests','Static vs Unit vs Integration vs E2E Testing for Frontend Apps',1,1743041568,1743754760);
INSERT INTO bookmarks VALUES(300,'https://kentcdodds.com/blog/testing-implementation-details','Testing Implementation Details',1,1743041568,1743123244);
INSERT INTO bookmarks VALUES(301,'https://kentcdodds.com/blog/avoid-the-test-user','Avoid the Test User',1,1743041568,1743123245);
INSERT INTO bookmarks VALUES(302,'https://kentcdodds.com/blog/should-i-write-a-test-or-fix-a-bug','Should I write a test or fix a bug?',1,1743041568,1743123246);
INSERT INTO bookmarks VALUES(303,'https://kentcdodds.com/blog/how-to-know-what-to-test','How to know what to test',1,1743041568,1743123246);
INSERT INTO bookmarks VALUES(304,'https://speakerdeck.com/twada/understanding-the-spiral-of-technologies-2023-edition','技術選定の審美眼（2023年版） / Understanding the Spiral of Technologies 2023 edition - Speaker Deck',1,1743055979,1743123253);
INSERT INTO bookmarks VALUES(305,'https://speakerdeck.com/twada/worse-is-better-understanding-the-spiral-of-technologies-2019-edition','Worse Is Better - 過去を知り、未来に備える。技術選定の審美眼 2019 edition / Worse Is Better - Understanding the Spiral of Technologies 2019 edition - Speaker Deck',1,1743055979,1743123249);
INSERT INTO bookmarks VALUES(306,'https://www.youtube.com/watch?v=cb4NxjglJak','(1) 【Panel Discussion】技術選定の審美眼（2024年版） フロントエンド技術の変化と開発者生産性を考える│RECRUIT TECH CONFERENCE 2024 - YouTube',1,1743055979,1743123250);
INSERT INTO bookmarks VALUES(307,'https://speakerdeck.com/twada/understanding-the-spiral-of-technologies','技術選定の審美眼 / Understanding the Spiral of Technologies - Speaker Deck',1,1743055979,1743123250);
INSERT INTO bookmarks VALUES(308,'https://blog.asial.co.jp/4049/','FedCM (Fedetated Credential Management API) 入門：進化したログイン方式を紹介 - アシアルTechブログ',1,1743390696,1743648121);
INSERT INTO bookmarks VALUES(309,'https://konifar-zatsu.hatenadiary.jp/entry/2022/03/24/143819','メンバーからのフィードバックに向き合う - Konifar''s ZATSU',1,1743390696,1743648122);
INSERT INTO bookmarks VALUES(310,'https://zenn.dev/inurun/articles/fc0ec63cad574b','Claude Desktopとmcp-server-qdrantで超お手軽ナレッジベースの構築',1,1743390696,1743648125);
INSERT INTO bookmarks VALUES(311,'https://docs.github.com/en/copilot/using-github-copilot/copilot-chat/asking-github-copilot-questions-in-github-mobile','Asking GitHub Copilot questions in GitHub Mobile - GitHub Docs',1,1743390696,1743648126);
INSERT INTO bookmarks VALUES(312,'https://zenn.dev/dinii/articles/d0a3a057b8f128','エンジニアのためのコミュニケーションベストプラクティス',1,1743390696,1743471108);
INSERT INTO bookmarks VALUES(313,'https://zenn.dev/arrowkato/articles/mcp_security','MCPサーバーを利用することはセキュリティ的に安全か?',1,1743390696,1743648130);
INSERT INTO bookmarks VALUES(314,'https://www.amazon.co.jp/dp/4798023809','入門Git | 濱野 純(Junio C Hamano) |本 | 通販 | Amazon',1,1743390696,1743648131);
INSERT INTO bookmarks VALUES(315,'https://speakerdeck.com/yoshidatomoaki/remix-plus-cloudflare-workers-develpment-tips','remix + cloudflare workers (DO) docker上でいい感じに開発する - Speaker Deck',1,1743390696,1743467031);
INSERT INTO bookmarks VALUES(316,'https://blog.cloudflare.com/remote-model-context-protocol-servers-mcp/','Build and deploy Remote Model Context Protocol (MCP) servers to Cloudflare',1,1743390696,1743468905);
INSERT INTO bookmarks VALUES(317,'https://speakerdeck.com/kworkdev/custom-refactoring-tool-go-analysis','Go の analysis パッケージで自作するリファクタリングツール - Speaker Deck',1,1743390696,1743469099);
INSERT INTO bookmarks VALUES(318,'https://speakerdeck.com/kuro_kurorrr/go-1-dot-24-go-vet-and-the-new-test-analyzer','Go1.24 go vetとtestsアナライザ - Speaker Deck',1,1743390696,1743470534);
INSERT INTO bookmarks VALUES(319,'https://github.com/tmc/nlm','tmc/nlm',1,1743390696,1743467004);
INSERT INTO bookmarks VALUES(320,'https://zenn.dev/gmomedia/articles/6ed3718b4c6bc1','最近のCSSを改めてちゃんと学んでみた',1,1743390696,1743818389);
INSERT INTO bookmarks VALUES(321,'https://zenncast-web.vercel.app/episodes/Bha8X18rSgr5k0tPDyTI','zenncast - 技術トレンドをAIがラジオに変換',1,1743390696,1743413131);
INSERT INTO bookmarks VALUES(322,'https://zenn.dev/mizchi/scraps/6407ec626b9673','WebSpeedHackathon2025 をやってみよう',1,1743390696,1743470822);
INSERT INTO bookmarks VALUES(323,'https://aws.amazon.com/jp/blogs/news/introducing-the-enhanced-command-line-interface-in-amazon-q-developer/','Amazon Q Developer CLI での超高速な新しいエージェント型のコーディング体験 | Amazon Web Services ブログ',1,1743390696,1743469187);
INSERT INTO bookmarks VALUES(324,'https://medium.com/nttlabs/why-you-should-contribute-to-open-source-software-06064db030a0','なぜオープンソースソフトウェアにコントリビュートすべきなのか. NTTの須田です。2024年9月に開催された 第57回 情報科学若手の会… | by Akihiro Suda | nttlabs | Mar, 2025 | Medium',1,1743390696,1743413128);
INSERT INTO bookmarks VALUES(325,'https://speakerdeck.com/yamanoku/learning-alien-signals-from-the-evolution-of-reactive-systems','リアクティブシステムの変遷から理解するalien-signals / Learning alien-signals from the evolution of reactive systems - Speaker Deck',1,1743390696,1743470993);
INSERT INTO bookmarks VALUES(326,'https://speakerdeck.com/syossan27/zui-xian-duan-wozhui-uqian-ni-mazuguang-meyou-aiturunopu-ji-huo-dong-nosusume','最先端を追う前に、まず広めよう！ 〜AIツールの普及活動のすすめ〜 - Speaker Deck',1,1743390696,1743470652);
INSERT INTO bookmarks VALUES(327,'https://www.works-i.com/research/report/turningpoint.html','報告書「令和の転換点」｜報告書｜リクルートワークス研究所',1,1743390696,1743740397);
INSERT INTO bookmarks VALUES(328,'https://zenn.dev/mutex_inc/articles/beca85dd7fdcae','【Atomic Designに懐疑的なあなたへ】改めて考えたい React / Next.js のデザインパターン',1,1743390696,1743413114);
INSERT INTO bookmarks VALUES(329,'https://konifar-zatsu.hatenadiary.jp/entry/2020/10/09/192919','仕事で親切と言われ始めたら注意 - Konifar''s ZATSU',1,1743390696,1743470577);
INSERT INTO bookmarks VALUES(330,'https://speakerdeck.com/wooootack/quality-improvement-team-reflection','チーム全員で品質課題の改善のために取り組んだことを振り返る / Quality improvement team reflection - Speaker Deck',1,1743390696,1743469781);
INSERT INTO bookmarks VALUES(331,'https://zenn.dev/tesla/articles/33d196d17bf3bb','Cline / Roo-Codeにおけるコード理解と新規・保守タスクの現状',1,1743390696,1743413119);
INSERT INTO bookmarks VALUES(332,'https://zenn.dev/coji/articles/react-router-v7-internal-flow','React Router v7 の内部構造を探る：リクエストからレンダリングまでの道のり',1,1743390696,1743413117);
INSERT INTO bookmarks VALUES(333,'https://findy-tools.io/products/trocco/17/417','GAS・関数地獄を脱出！TROCCOでストレスフリーなデータ管理',1,1743390696,1743412701);
INSERT INTO bookmarks VALUES(334,'https://zenn.dev/headwaters/articles/883ddc2c961335','今月面白いと思ったITトピック 2025/03　(VLM関係多め)',1,1743390696,1743412704);
INSERT INTO bookmarks VALUES(335,'https://zenn.dev/headwaters/articles/c417ca8b28860d','AIドリブンな開発のメリット',1,1743390696,1743412698);
INSERT INTO bookmarks VALUES(336,'https://creators.bengo4.com/entry/2025/03/28/070000','制約が解き放つ可能性 - Devin AI との対話に見たもの - 弁護士ドットコム株式会社 Creators’ blog',1,1743390696,1743412583);
INSERT INTO bookmarks VALUES(337,'https://zenn.dev/codeciao/articles/6d0a83e234a34a?redirected=1','Clineに全部賭ける前に　〜Clineの動作原理を深掘り〜',1,1743740391,1743816237);
INSERT INTO bookmarks VALUES(338,'https://zenn.dev/dinii/articles/readable-code-explained-in-dep-graph?redirected=1','「読みやすいコード」を依存グラフで考える',1,1743740391,1743816490);
INSERT INTO bookmarks VALUES(339,'https://zenn.dev/imajoriri/books/2ab1be474e53c8','技術視点で深掘るUI/UX入門',1,1743740391,1743818389);
INSERT INTO bookmarks VALUES(340,'https://zenn.dev/kimuson/articles/claude_crew_introduction','Claude Desktop におけるコーディングエージェント性能を拡張する「Claude Crew」の紹介',1,1743819660,1743833545);
INSERT INTO bookmarks VALUES(341,'https://zenn.dev/acntechjp/articles/bdd5816a54ad1b','【新時代のAIエージェント】Genspark Super Agent 触ってみた',1,1743819660,1743833631);
INSERT INTO bookmarks VALUES(342,'https://zenn.dev/sqer/articles/7563473a283da8','Copilot Agent Modeのレートリミットを超えるための拡張機能 ~ Copilot Boost Mode',1,1743819660,1743833693);
INSERT INTO bookmarks VALUES(343,'https://dev.to/copilotkit/automate-90-of-your-work-with-ai-agents-real-examples-code-inside-46ke','Automate 90% of Your Work with AI Agents (Real Examples & Code Inside) 🚀 🤖 - DEV Community',1,1743819660,1743833781);
INSERT INTO bookmarks VALUES(344,'https://zenn.dev/erukiti/articles/2504-coding-agent','TIPS: コーディングエージェントの活用時、高速目grepで消耗しないために重要なタイムリープ戦術',1,1743819660,1743833854);
INSERT INTO bookmarks VALUES(345,'https://qiita.com/kazunoriboy/items/3842580e7d702f1b2f10','生成AIを使ってどこまでサイト制作ができるのか試してみた #LLM - Qiita',1,1743819660,1743833913);
INSERT INTO bookmarks VALUES(346,'https://tech.findy.co.jp/entry/2025/04/04/070000','Findyの爆速開発を支える生成AI活用 ~プロンプトの書き方編~ - Findy Tech Blog',1,1743819660,1743833963);
INSERT INTO bookmarks VALUES(347,'https://zenn.dev/gemcook/articles/weekly-cloudflare_2025_0323-0329','週刊Cloudflare - 2025/03/30週',1,1743819660,1743834019);
INSERT INTO bookmarks VALUES(348,'https://developers.freee.co.jp/entry/we-have-started-AI-agent-security-test','脆弱性診断 with AIエージェント、はじめました。 - freee Developers Hub',1,1743819660,1743849313);
INSERT INTO bookmarks VALUES(349,'https://findy-code.io/media/articles/modoku20250404-yusuktan','【#も読】MCPことはじめ / MCPサーバーのセキュリティリスク（@yusuktan）',1,1743821710,1743916805);
INSERT INTO bookmarks VALUES(350,'https://zenn.dev/calloc134/articles/honox-thread-float-bbs','最新技術スタックで伝統掲示板を再構築: HonoXでスレッドフロート型掲示板を作った話',1,1743821710,1743917197);
INSERT INTO bookmarks VALUES(351,'https://tech.acesinc.co.jp/entry/2025/04/04/083000','Cursor AIエージェントによる既存コードのアップデート戦略 - ACES エンジニアブログ',1,1743821710,1743917198);
INSERT INTO bookmarks VALUES(352,'https://jser.info/','JSer.info',1,1743821710,1743917199);
INSERT INTO bookmarks VALUES(353,'https://github.blog/news-insights/product-news/github-copilot-agent-mode-activated/','Vibe coding with GitHub Copilot: Agent mode and MCP support rolling out to all VS Code users - The GitHub Blog',1,1743821710,1743917278);
INSERT INTO bookmarks VALUES(354,'https://zenn.dev/coji/articles/react-router-v7-internal-flow','React Router v7 の内部構造を探る：リクエストからレンダリングまでの道のり',1,1743821710,1744380108);
INSERT INTO bookmarks VALUES(355,'https://speakerdeck.com/flatt_security/apurikesiyongu-you-no-rozitukunocui-ruo-xing-wofang-gukai-fa-zhe-notamenosekiyuriteiguan-dian','アプリケーション固有の「ロジックの脆弱性」を防ぐ開発者のためのセキュリティ観点 - Speaker Deck',1,1743821710,1743918062);
INSERT INTO bookmarks VALUES(356,'https://voluntas.ghost.io/tailscale-supports-windows-and-macos-on-github-actions/','tailscale/github-action が Windows と macOS に対応した',1,1743821710,1743917313);
INSERT INTO bookmarks VALUES(357,'https://findy-tools.io/products/amazondynamodb/404/408','DynamoDB: アーリーからレイトステージまで支える揺るぎない信頼性',1,1743821710,1743917413);
INSERT INTO bookmarks VALUES(358,'https://tmokmss.hatenablog.com/entry/self_host_autonomous_swe_agents_on_aws','Devin的な自律型開発エージェントをAWS上に作ってみた！ - maybe daily dev notes',1,1743821710,1743917605);
INSERT INTO bookmarks VALUES(359,'https://mgkkk.hatenablog.com/entry/2025/03/28/004326','会社を辞める準備として株を始めたが株をやるなら会社員を続けた方がいいと分かってしまって困る関連 - 漫画皇国',1,1743821710,1743917530);
INSERT INTO bookmarks VALUES(360,'https://syu-m-5151.hatenablog.com/entry/2025/04/04/085754','生成AI時代に必要なシェルの基本知識とシェル芸への入門 - じゃあ、おうちで学べる',1,1743821710,1744595436);
INSERT INTO bookmarks VALUES(361,'https://zenn.dev/mizchi/scraps/6407ec626b9673','WebSpeedHackathon2025 をやってみよう',1,1743916672,1743917610);
INSERT INTO bookmarks VALUES(362,'https://zenn.dev/yamachan0625/books/ddd-hands-on/viewer/chapter5_event_storming','イベントストーミング｜【DDD入門】TypeScript × ドメイン駆動設計ハンズオン',1,1743916672,1743917611);
INSERT INTO bookmarks VALUES(363,'https://offers.jp/worker/events/connpass_52','テストしやすいコードとは？tenntenn氏、渋川氏、zoncoen氏に聞くGoテスト設計最前線 | Offers「オファーズ」 - エンジニア、PM、デザイナーの副業・転職採用サービス',1,1743916672,1743917612);
INSERT INTO bookmarks VALUES(364,'https://zenn.dev/kadoya/articles/872f4dac6d8bcc','CursorからMCPで社内のドキュメントや仕様書を参照する方法',1,1743979985,1743984439);
INSERT INTO bookmarks VALUES(365,'https://developer.dip-net.co.jp/entry/2025/04/04/Knip%E3%81%A7%E5%AE%89%E5%BF%83%E3%81%97%E3%81%A6%E3%83%87%E3%83%83%E3%83%89%E3%82%B3%E3%83%BC%E3%83%89%E3%82%92%E6%92%B2%E6%BB%85%E3%81%99%E3%82%8B','Knipで安心してデッドコードを撲滅する - dip Engineer Blog',1,1743979985,1743984388);
INSERT INTO bookmarks VALUES(366,'https://zenn.dev/ubie_dev/articles/f927aaff02d618','社内デザインシステムをMCPサーバー化したらUI実装が爆速になった',1,1743979985,1743984350);
INSERT INTO bookmarks VALUES(367,'https://zenn.dev/ks0318/articles/4b201527b383fa','AIを用いた開発の効率を最大化させるためにやっていることを全部書く',1,1743979985,1743984256);
INSERT INTO bookmarks VALUES(368,'https://securityaffairs.com/176224/security/chatgpt-4o-to-create-a-replica-of-his-passport-in-just-five-minutes.html','Expert used ChatGPT-4o to create a replica of his passport in just 5 minutes bypassing KYC',1,1744075145,1744379984);
INSERT INTO bookmarks VALUES(369,'https://voluntas.ghost.io/why-mcp/','なぜ MCP なのか',1,1744075145,1744345069);
INSERT INTO bookmarks VALUES(370,'https://blog.cloudflare.com/welcome-to-developer-week-2025/','Welcome to Developer Week 2025',1,1744075145,1744179646);
INSERT INTO bookmarks VALUES(371,'https://github.com/prisma/prisma/issues/26592','Prisma ORM Roadmap: March – May 2025 · Issue #26592 · prisma/prisma',1,1744075145,1744345412);
INSERT INTO bookmarks VALUES(372,'https://laconicwit.com/dont-mock-your-framework-writing-tests-you-wont-regret/','Don''t Mock Your Framework: Writing Tests You Won''t Regret',1,1744075145,1744380026);
INSERT INTO bookmarks VALUES(373,'https://research.sakura.ad.jp/blog/the-process-of-renewing-the-research-website','WordPressからNotion + Next.jsへ 研究所ブログを全面リニューアル - さくらインターネット研究所 ブログ',1,1744075145,1744345659);
INSERT INTO bookmarks VALUES(374,'https://azukiazusa.dev/blog/build-your-own-coding-ai-agent/','コーディング AI エージェントを自作してみよう',1,1744075145,1744345171);
INSERT INTO bookmarks VALUES(375,'https://times.serizawa.me/p/human-mcp','👨‍🔧 人間をMCPツールとして利用する',1,1744075145,1744380048);
INSERT INTO bookmarks VALUES(376,'https://blog.lai.so/devin/','Devinと人類に残されたクリップボード運搬業',1,1744075145,1744362164);
INSERT INTO bookmarks VALUES(377,'https://blog.lai.so/sonnet-cutoff/','React Router v7でコードを書いてくれSonnet',1,1744075145,1744362213);
INSERT INTO bookmarks VALUES(378,'https://www.m3tech.blog/entry/future-with-mcp-servers','MCPサーバーが切り拓く！自社サービス運用の新次元 - エムスリーテックブログ',1,1744075145,1744517566);
INSERT INTO bookmarks VALUES(379,'https://developers.cloudflare.com/changelog/2025-04-04-playwright-beta/','Playwright for Browser Rendering now available | Cloudflare Docs',1,1744075145,1744179648);
INSERT INTO bookmarks VALUES(380,'https://github.blog/news-insights/product-news/github-copilot-agent-mode-activated/','Vibe coding with GitHub Copilot: Agent mode and MCP support rolling out to all VS Code users - The GitHub Blog',1,1744075145,1744436900);
INSERT INTO bookmarks VALUES(381,'https://github.blog/changelog/2025-04-04-copilot-code-review-now-generally-available/','Copilot code review now generally available - GitHub Changelog',1,1744075145,1744380138);
INSERT INTO bookmarks VALUES(382,'https://zenn.dev/shunsuke_suzuki/articles/github-security-2025','GitHub のセキュリティ改善',1,1744075340,1744380195);
INSERT INTO bookmarks VALUES(383,'https://zenn.dev/erukiti/articles/2504-boomerang-mode','Roo CodeのBoomerang Modeありかも',1,1744075340,1744436996);
INSERT INTO bookmarks VALUES(384,'https://dev.to/supabase/supabase-mcp-server-4jh9','Supabase MCP Server - DEV Community',1,1744075340,1744596431);
INSERT INTO bookmarks VALUES(385,'https://syu-m-5151.hatenablog.com/entry/2025/04/07/181150','エンジニアブログは技術的であるべきで登壇は衒学的であると思う理由 - じゃあ、おうちで学べる',1,1744126668,1744464568);
INSERT INTO bookmarks VALUES(386,'https://blog.cloudflare.com/how-hyperdrive-speeds-up-database-access/','海の向こうのプール: Hyperdrive がデータベースへのアクセスを高速化する方法と、なぜ無料にするのか',1,1744126668,1744179651);
INSERT INTO bookmarks VALUES(387,'https://www.itmedia.co.jp/enterprise/articles/2504/01/news072.html#utm_medium=email&utm_source=ent-mag&utm_campaign=20250408','AI時代にグンと伸びる「AI以外のツール」とは？　ITR調査 - ITmedia エンタープライズ',1,1744126668,1744596494);
INSERT INTO bookmarks VALUES(388,'https://www.itmedia.co.jp/enterprise/articles/2504/01/news073.html#utm_medium=email&utm_source=ent-mag&utm_campaign=20250408','マルウェア開発にリライトの波？　GoやRustなど新たな言語に移行か：セキュリティニュースアラート - ITmedia エンタープライズ',1,1744126668,1744596469);
INSERT INTO bookmarks VALUES(389,'https://zenn.dev/uzulla/articles/f23d1e92966c6f','Claude codeに校則違反の悪い事を教える、買い食いとか',1,1744126668,1744436851);
INSERT INTO bookmarks VALUES(390,'https://www.itmedia.co.jp/enterprise/articles/2504/07/news036.html#utm_medium=email&utm_source=ent-mag&utm_campaign=20250409','ゼロ円でできるセキュリティ対策　「認知バイアス」を改善する6つの実践的手法：認知バイアスで考えるサイバーセキュリティ - ITmedia エンタープライズ',1,1744159939,1744596470);
INSERT INTO bookmarks VALUES(391,'https://www.itmedia.co.jp/enterprise/articles/2504/08/news069.html#utm_medium=email&utm_source=ent-mag&utm_campaign=20250409','Webブラウザ利用者が知らずに犯してしまう「ルール違反」とは？：半径300メートルのIT - ITmedia エンタープライズ',1,1744159939,1744691572);
INSERT INTO bookmarks VALUES(392,'https://www.itmedia.co.jp/enterprise/articles/2504/07/news052.html#utm_medium=email&utm_source=ent-mag&utm_campaign=20250409','IPA、「企業組織向けサイバーセキュリティ相談窓口」を新設　何を相談できるのか？：セキュリティニュースアラート - ITmedia エンタープライズ',1,1744159939,1745070908);
INSERT INTO bookmarks VALUES(393,'https://dev.classmethod.jp/articles/cline-github-mcp/','ClineとGitHub MCPで実現するPull Request作成の自動化 | DevelopersIO',1,1744160011,1744598651);
INSERT INTO bookmarks VALUES(394,'https://modelcontextprotocol.io/clients','Example Clients - Model Context Protocol',1,1744160011,1744596496);
INSERT INTO bookmarks VALUES(395,'https://blog.cloudflare.com/full-stack-development-on-cloudflare-workers/','Your frontend, backend, and database — now in one Cloudflare Worker',1,1744160011,1744179653);
INSERT INTO bookmarks VALUES(396,'https://atmarkit.itmedia.co.jp/ait/articles/2504/08/news095.html','Google、無料オープンソース脆弱性スキャンツール「OSV-Scanner V2.0.0」公開　コンテナスキャンに対応、その他の新機能は？：Mavenの「pom.xml」にも対応 - ＠IT',0,1744160011,1744160011);
INSERT INTO bookmarks VALUES(397,'https://speakerdeck.com/kworkdev/text-knowledge-install-ai-context','”知のインストール”戦略：テキスト資産をAIの文脈理解に活かす - Speaker Deck',0,1744160011,1744160011);
INSERT INTO bookmarks VALUES(398,'https://blog.cloudflare.com/introducing-the-cloudflare-vite-plugin/','"Just use Vite”… with the Workers runtime',1,1744160011,1744179656);
INSERT INTO bookmarks VALUES(399,'https://blog.lai.so/cursor-vs-cline/','Cursorのコード編集はClineよりどの程度早いのか？',0,1744160011,1744160011);
INSERT INTO bookmarks VALUES(400,'https://knowledge.sakura.ad.jp/42334/','クラウドサービス事業者におけるOSS 〜マネージドサービスとオープンソースSDK〜 | さくらのナレッジ',1,1744160011,1744596495);
INSERT INTO bookmarks VALUES(401,'https://developers.cyberagent.co.jp/blog/archives/55753/','爆速スッキリ！Rspack移行の成果と道のり / Muddy Web #11 ~Special Edition~ 【ゲスト: Cybozu】 | CyberAgent Developers Blog',0,1744160011,1744160011);
INSERT INTO bookmarks VALUES(402,'https://developers.cloudflare.com/durable-objects/best-practices/websockets/#websocket-hibernation-api','Use WebSockets · Cloudflare Durable Objects docs',1,1744164286,1744179659);
INSERT INTO bookmarks VALUES(403,'https://blog.cloudflare.com/cloudflare-acquires-outerbase-database-dx/','Cloudflare acquires Outerbase to expand database and agent developer experience capabilities',0,1744184567,1744184567);
INSERT INTO bookmarks VALUES(404,'https://blog.cloudflare.com/deploying-nextjs-apps-to-cloudflare-workers-with-the-opennext-adapter/','Deploy your Next.js app to Cloudflare Workers with the Cloudflare adapter for OpenNext',0,1744184567,1744184567);
INSERT INTO bookmarks VALUES(405,'https://blog.cloudflare.com/introducing-autorag-on-cloudflare/','Introducing AutoRAG: fully managed Retrieval-Augmented Generation on Cloudflare',1,1744184567,1744596499);
INSERT INTO bookmarks VALUES(406,'https://blog.cloudflare.com/workflows-ga-production-ready-durable-execution/','Cloudflare Workflows is now GA: production-ready durable execution',1,1744184567,1744595439);
INSERT INTO bookmarks VALUES(407,'https://blog.cloudflare.com/building-ai-agents-with-mcp-authn-authz-and-durable-objects/','Piecing together the Agent puzzle: MCP, authentication & authorization, and Durable Objects free tier',1,1744184567,1744596471);
INSERT INTO bookmarks VALUES(408,'https://blog.cloudflare.com/introducing-cloudflare-realtime-and-realtimekit/','Make your apps truly interactive with Cloudflare Realtime and RealtimeKit',0,1744241597,1744241597);
INSERT INTO bookmarks VALUES(409,'https://bun.sh/blog/debugging-memory-leaks','Debugging JavaScript Memory Leaks | Bun Blog',1,1744241597,1744596475);
INSERT INTO bookmarks VALUES(410,'https://cloud.google.com/run/docs/release-notes#April_07_2025','Cloud Run release notes  |  Cloud Run Documentation  |  Google Cloud',0,1744241597,1744241597);
INSERT INTO bookmarks VALUES(411,'https://six-loganberry-ba7.notion.site/25-04-09-VSCode-as-MCP-Server-1d0f7e7600e9809c9806d73cb67c2345','25/04/09 緊急テスト！VSCode as MCP Server',1,1744241597,1744517007);
INSERT INTO bookmarks VALUES(412,'https://github.com/google/A2A','google/A2A',1,1744241597,1744595649);
INSERT INTO bookmarks VALUES(413,'https://x.com/LangChainJP/status/1909898962623963531','x.com/LangChainJP/status/1909898962623963531/photo/1',1,1744241597,1744464670);
INSERT INTO bookmarks VALUES(414,'https://japan.cnet.com/article/35231551/','JBL、「Flip 7」「Charge 6」発売--約4年ぶりのポータブルスピーカー新モデル、9色用意 - CNET Japan',1,1744241597,1744464611);
INSERT INTO bookmarks VALUES(415,'https://www.publickey1.jp/blog/25/google_cloudaiagent2agent50.html','［速報］Google Cloudが複数のAIエージェントを連携させる「Agent2Agentプロトコル」を発表。50社以上がサポートを表明 － Publickey',0,1744241597,1744241597);
INSERT INTO bookmarks VALUES(416,'https://v4.zod.dev/v4','Introducing Zod 4 beta | Zod Docs',0,1744241597,1744241597);
INSERT INTO bookmarks VALUES(417,'https://blog.cloudflare.com/snippets/','Cloudflare Snippets are now Generally Available',0,1744241597,1744241597);
INSERT INTO bookmarks VALUES(418,'https://konifar-zatsu.hatenadiary.jp/entry/2023/05/26/154359','極端な自責と他責を使い分ける - Konifar''s ZATSU',1,1744241597,1744516410);
INSERT INTO bookmarks VALUES(419,'https://zenn.dev/gemcook/articles/0dced77271059e','フォームライブラリの新たな選択肢 - TanStack Form',1,1744241597,1744516704);
INSERT INTO bookmarks VALUES(420,'https://speakerdeck.com/watany/cline-without-vibe-coding','Vibe Codingをせずに Clineを使っている - Speaker Deck',1,1744241597,1744436571);
INSERT INTO bookmarks VALUES(421,'https://zenn.dev/acomagu/articles/396eb97b5c1b52','VSCodeをMCPにする拡張機能「VSCode as MCP Server」を作った',1,1744241597,1744516627);
INSERT INTO bookmarks VALUES(422,'https://x.com/CloudflareDev/status/1909825036493509097','x.com/CloudflareDev/status/1909825036493509097/photo/1',1,1744241597,1744377871);
INSERT INTO bookmarks VALUES(423,'https://zenn.dev/mizchi/articles/pglite-vector-search','PGlite + pgvector で100行で実装するベクトル検索 (node/deno/drizzle)',0,1744241597,1744241597);
INSERT INTO bookmarks VALUES(424,'https://speakerdeck.com/masuda220/software-design-class-versoin2','これだけは知っておきたいクラス設計の基礎知識 version 2 - Speaker Deck',0,1744241597,1744241597);
INSERT INTO bookmarks VALUES(425,'https://t-suzuki.hatenablog.jp/entry/2025/04/09/181845','スタートアップ生活と離職について - ふわっとしたやつ',1,1744241597,1744436451);
INSERT INTO bookmarks VALUES(426,'https://www.itmedia.co.jp/aiplus/articles/2504/08/news169.html','Sakana AI、“査読通過”した論文執筆AIシステムをオープンソース化　機能を解説する資料も公開 - ITmedia AI＋',1,1744241597,1744246065);
INSERT INTO bookmarks VALUES(427,'https://katiesteckles.co.uk/pisearch/','Pi Search',1,1744254125,1744258302);
INSERT INTO bookmarks VALUES(428,'https://hiroppy.me/','hiroppy''s site',1,1744254125,1744377856);
INSERT INTO bookmarks VALUES(429,'https://toggl.com/','Toggl Track: Time Tracking Software for Any Workflow',1,1744254125,1744377852);
INSERT INTO bookmarks VALUES(430,'https://rspack.dev/','Rspack',1,1744254125,1744261095);
INSERT INTO bookmarks VALUES(431,'https://zenn.dev/aldagram_tech/articles/alda-clinerules','.clinerulesを導入して、開発効率を上げていきたい話',1,1744327844,1744436685);
INSERT INTO bookmarks VALUES(432,'https://zenn.dev/kooo5252/articles/2e9e45bdab99b1','生成AIの時代にクリーンアーキテクチャは古いかなと思った',1,1744327844,1744377846);
INSERT INTO bookmarks VALUES(433,'https://zenn.dev/notahotel/articles/93c091713bb199','API仕様書を読み取れるMCPサーバーを自作したら開発が爆速になった',0,1744327844,1744327844);
INSERT INTO bookmarks VALUES(434,'https://www.docswell.com/s/kikkis/5XE33Y-2025-03-10-100629','Playwrightで実現する品質保証の好循環な仕組み | ドクセル',1,1744327844,1744517170);
INSERT INTO bookmarks VALUES(435,'https://zenn.dev/ryoppippi/articles/1eb7fbe9042a88','SiteMCP: 任意のサイトを丸ごとMCPサーバー化',1,1744327844,1744345377);
INSERT INTO bookmarks VALUES(436,'https://qiita.com/zutoasa/items/7c17c372e550cab88073','React開発に役立つ主要ライブラリ一覧と選定ガイド #JavaScript - Qiita',1,1744327844,1744516921);
INSERT INTO bookmarks VALUES(437,'https://zenn.dev/gemcook/articles/weekly-cloudflare_2025_0330-0405','週刊Cloudflare - 2025/04/06週',1,1744327844,1744436329);
INSERT INTO bookmarks VALUES(438,'https://tech.layerx.co.jp/entry/specification-by-devin-for-ai-onboarding','仕様理解を促進するDevinの活用—ドキュメント生成の効率化とCursor連携 - LayerX エンジニアブログ',1,1744327844,1744377695);
INSERT INTO bookmarks VALUES(439,'https://zenn.dev/rescuenow/articles/55ea72023527d1','GitHub Copilot コードレビュー機能でプルリクエストを日本語でレビューしてもらいたい',1,1744327844,1744362311);
INSERT INTO bookmarks VALUES(440,'https://zenn.dev/cloud_ace/articles/4628a0e0d43c58','Cloud Run だけでユーザ認証ができるようになったぞ',1,1744327844,1744362288);
INSERT INTO bookmarks VALUES(441,'https://zenn.dev/cloud_ace/articles/trial-audit-manager','Google Cloud環境のコンプライアンス準拠を省力化するAudit Manager',1,1744327844,1744362384);
INSERT INTO bookmarks VALUES(442,'https://developers.gmo.jp/technology/62663/','DevSecOps文化を育てる：少しずつ、でも着実にチームと前進するために / 開発者向けブログ・イベント | GMO Developers',1,1744327844,1744362200);
INSERT INTO bookmarks VALUES(443,'https://fiberplane.com/','Fiberplane | Fiberplane',1,1744434521,1744517370);
CREATE TABLE IF NOT EXISTS "favorites" (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bookmark_id` integer NOT NULL,
	`created_at` integer DEFAULT '"2025-06-02T05:18:59.282Z"' NOT NULL,
	FOREIGN KEY (`bookmark_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS "labels" (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT '"2025-06-02T05:18:59.282Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-06-02T05:18:59.282Z"' NOT NULL
);
INSERT INTO labels VALUES(1,'needs-review',NULL,1744539010,1744539010);
INSERT INTO labels VALUES(2,'typescript',NULL,1744539010,1744539010);
INSERT INTO labels VALUES(3,'react',NULL,1744539012,1744539012);
INSERT INTO labels VALUES(4,'cloudflare',NULL,1744539018,1744539018);
CREATE TABLE IF NOT EXISTS "rss_batch_logs" (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feed_id` integer,
	`status` text NOT NULL,
	`items_fetched` integer DEFAULT 0 NOT NULL,
	`items_created` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`created_at` integer DEFAULT '"2025-06-02T05:18:59.283Z"' NOT NULL,
	FOREIGN KEY (`feed_id`) REFERENCES `rss_feeds`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE IF NOT EXISTS "rss_feed_items" (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feed_id` integer NOT NULL,
	`guid` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`published_at` integer,
	`fetched_at` integer DEFAULT '"2025-06-02T05:18:59.283Z"' NOT NULL,
	`created_at` integer DEFAULT '"2025-06-02T05:18:59.283Z"' NOT NULL,
	FOREIGN KEY (`feed_id`) REFERENCES `rss_feeds`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE IF NOT EXISTS "rss_feeds" (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_fetched_at` integer,
	`next_fetch_at` integer,
	`created_at` integer DEFAULT '"2025-06-02T05:18:59.283Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-06-02T05:18:59.283Z"' NOT NULL
);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('d1_migrations',9);
INSERT INTO sqlite_sequence VALUES('article_labels',0);
INSERT INTO sqlite_sequence VALUES('bookmarks',443);
INSERT INTO sqlite_sequence VALUES('favorites',0);
INSERT INTO sqlite_sequence VALUES('labels',4);
INSERT INTO sqlite_sequence VALUES('rss_batch_logs',0);
INSERT INTO sqlite_sequence VALUES('rss_feed_items',0);
INSERT INTO sqlite_sequence VALUES('rss_feeds',0);
CREATE UNIQUE INDEX `article_ratings_article_id_unique` ON `article_ratings` (`article_id`);
CREATE UNIQUE INDEX `favorites_bookmark_id_unique` ON `favorites` (`bookmark_id`);
CREATE UNIQUE INDEX `labels_name_unique` ON `labels` (`name`);
CREATE UNIQUE INDEX `rss_feeds_url_unique` ON `rss_feeds` (`url`);