import React, { type ReactNode } from 'react'

import { getJsonData } from '@/lib/api/ArcheSymfonyApi';

interface TestApiProps {
  id: string;
  language: string;
}

export default async function TestApi({ id, language} : Readonly<TestApiProps>): Promise<ReactNode> {
const controller = new AbortController();

	console.log("TESTA PI 1");
	console.log(id);
	console.log(language);

	const metadata = await getJsonData({ id:id, page:"breadcrumb", language: language,signal: controller.signal, });
	console.log("TESTAPI");
	console.log(metadata);


	return (
		<div>TestApi</div>
	)
}


