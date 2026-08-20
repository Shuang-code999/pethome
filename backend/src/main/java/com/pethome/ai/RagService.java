package com.pethome.ai;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.reader.markdown.MarkdownDocumentReader;
import org.springframework.ai.reader.markdown.config.MarkdownDocumentReaderConfig;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.util.List;

/** RAG 知识库：加载宠物养护知识，问诊时检索相关内容 */
@Slf4j
@Service
public class RagService {

    @Value("classpath:/knowledge/pet-care.md")
    private Resource knowledgeResource;

    private final EmbeddingModel embeddingModel;
    private SimpleVectorStore vectorStore;
    private int documentCount = 0;

    public RagService(EmbeddingModel embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    @PostConstruct
    public void init() {
        try {
            this.vectorStore = SimpleVectorStore.builder(embeddingModel).build();
            MarkdownDocumentReaderConfig readerConfig = MarkdownDocumentReaderConfig.defaultConfig();
            MarkdownDocumentReader reader = new MarkdownDocumentReader(knowledgeResource, readerConfig);
            List<Document> docs = reader.get();
            TokenTextSplitter splitter = new TokenTextSplitter(500, 100, 30, 1000, true);
            List<Document> chunks = splitter.apply(docs);
            vectorStore.add(chunks);
            this.documentCount = chunks.size();
            log.info("RAG 知识库加载完成，共 {} 个 chunk", chunks.size());
        } catch (Exception e) {
            log.warn("RAG 知识库初始化失败: {}", e.getMessage());
            this.vectorStore = SimpleVectorStore.builder(embeddingModel).build();
            this.documentCount = 0;
        }
    }

    public String retrieve(String query) {
        return retrieve(query, 3);
    }

    public String retrieve(String query, int topK) {
        if (vectorStore == null) return "";
        try {
            List<Document> docs = vectorStore.similaritySearch(SearchRequest.builder()
                    .query(query)
                    .topK(topK)
                    .build());
            if (docs == null || docs.isEmpty()) return "";
            StringBuilder sb = new StringBuilder("\n\n【参考资料】\n");
            for (int i = 0; i < docs.size(); i++) {
                sb.append(i + 1).append(". ").append(docs.get(i).getText()).append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            log.warn("RAG 检索失败: {}", e.getMessage());
            return "";
        }
    }

    public int getDocumentCount() {
        return documentCount;
    }
}
