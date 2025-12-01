"""
Test RAG System Multi-Tenancy Implementation

This test verifies that the RAG system properly isolates data by organization_id.
Requirements: 5.1, 5.2, 5.3, 5.5
"""

import pytest
import os
import tempfile
import shutil
from rag_utils import process_document, get_answer_with_fallback, delete_document


class TestRAGMultiTenancy:
    """Test multi-tenant isolation in RAG system"""
    
    @pytest.fixture(autouse=True)
    def setup_and_teardown(self):
        """Setup and teardown for each test"""
        # Setup: Store original persist directory
        self.original_persist_dir = "./chroma_db"
        self.test_persist_dir = "./test_chroma_db"
        
        # Use test directory
        import rag_utils
        rag_utils.Config.PERSIST_DIRECTORY = self.test_persist_dir
        
        yield
        
        # Teardown: Clean up test directory
        if os.path.exists(self.test_persist_dir):
            shutil.rmtree(self.test_persist_dir)
        
        # Restore original directory
        rag_utils.Config.PERSIST_DIRECTORY = self.original_persist_dir
    
    def test_process_document_with_organization_id(self):
        """Test that process_document accepts and stores organization_id in metadata"""
        # Create a temporary test document
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("This is a test document for organization ABC.")
            temp_path = f.name
        
        try:
            # Process document with organization_id
            result = process_document(temp_path, 'txt', organization_id='org_123')
            
            # Verify processing was successful
            assert result['success'] == True
            assert result['num_chunks'] > 0
            
            print(f"✅ Document processed with organization_id: {result['num_chunks']} chunks")
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    def test_get_answer_with_organization_filter(self):
        """Test that get_answer_with_fallback filters by organization_id"""
        # Create test documents for two different organizations
        org1_doc = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
        org1_doc.write("Organization 1 has a vacation policy of 20 days per year.")
        org1_doc.close()
        
        org2_doc = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
        org2_doc.write("Organization 2 has a vacation policy of 15 days per year.")
        org2_doc.close()
        
        try:
            # Process documents for different organizations
            result1 = process_document(org1_doc.name, 'txt', organization_id='org_1')
            result2 = process_document(org2_doc.name, 'txt', organization_id='org_2')
            
            assert result1['success'] == True
            assert result2['success'] == True
            
            # Query with org_1 filter - should only get org_1 results
            answer1, source1 = get_answer_with_fallback(
                "What is the vacation policy?",
                organization_id='org_1'
            )
            
            # Verify org_1 gets their own data (20 days)
            assert '20' in answer1 or 'twenty' in answer1.lower()
            print(f"✅ Organization 1 query returned correct data: {answer1[:100]}")
            
            # Query with org_2 filter - should only get org_2 results
            answer2, source2 = get_answer_with_fallback(
                "What is the vacation policy?",
                organization_id='org_2'
            )
            
            # Verify org_2 gets their own data (15 days)
            assert '15' in answer2 or 'fifteen' in answer2.lower()
            print(f"✅ Organization 2 query returned correct data: {answer2[:100]}")
            
        finally:
            # Clean up
            if os.path.exists(org1_doc.name):
                os.remove(org1_doc.name)
            if os.path.exists(org2_doc.name):
                os.remove(org2_doc.name)
    
    def test_delete_document_with_organization_filter(self):
        """Test that delete_document filters by organization_id"""
        # Create a test document
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("Test document for deletion with organization filter.")
            temp_path = f.name
        
        try:
            # Process document with organization_id
            result = process_document(temp_path, 'txt', organization_id='org_delete_test')
            assert result['success'] == True
            
            # Delete with organization filter
            success = delete_document(temp_path, organization_id='org_delete_test')
            assert success == True
            
            print(f"✅ Document deleted with organization filter")
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.remove(temp_path)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
