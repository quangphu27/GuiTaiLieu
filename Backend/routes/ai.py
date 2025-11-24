import os
import json
from flask import Blueprint, request, jsonify, Response, stream_with_context
from models.unit import Unit
from models.document import Document
from utils.jwt_helper import jwt_required as auth_required
from utils.ai_service import suggest_units_from_document, suggest_units_from_document_streaming, extract_text_from_file

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/suggest-units', methods=['POST'])
@auth_required
def suggest_units_endpoint():
    try:
        data = request.get_json()
        document_id = data.get('document_id', '')
        
        if not document_id:
            return jsonify({'message': 'Vui lòng cung cấp ID tài liệu'}), 400
        
        document = Document.get_by_id(document_id)
        if not document:
            return jsonify({'message': 'Không tìm thấy tài liệu'}), 404
        
        all_units = Unit.get_all()
        units_with_id = [Unit.to_dict(unit) for unit in all_units]
        
        if not units_with_id:
            return jsonify({
                'suggested_units': [], 
                'suggested_ids': [],
                'has_suggestions': False,
                'message': 'Không có đơn vị phù hợp'
            }), 200
        
        filepath = document.get('filepath', '')
        extracted_content = extract_text_from_file(filepath) if filepath else None
        
        final_suggested_ids = set()
        last_result = None
        has_first_success = False
        
        for result in suggest_units_from_document_streaming(document, units_with_id):
            last_result = result
            
            if result.get('chunk_index', 0) > 0:
                final_suggested_ids.update(result.get('suggested_ids', []))
                has_first_success = True
            
            if result.get('is_fallback', False):
                break
        
        final_suggested_ids = list(final_suggested_ids)[:5] if final_suggested_ids else []
        suggested_units = [unit for unit in units_with_id if unit['id'] in final_suggested_ids]
        
        return jsonify({
            'suggested_units': suggested_units,
            'suggested_ids': final_suggested_ids,
            'has_suggestions': len(final_suggested_ids) > 0,
            'message': last_result.get('message', '') if last_result else 'Không có đơn vị phù hợp',
            'is_fallback': last_result.get('is_fallback', False) if last_result else True,
            'chunk_index': last_result.get('chunk_index', 0) if last_result else 0,
            'total_chunks': last_result.get('total_chunks', 1) if last_result else 1,
            'is_final': True,
            'extracted_content': extracted_content[:1000] if extracted_content else None,
            'extracted_length': len(extracted_content) if extracted_content else 0
        }), 200
    
    except:
        return jsonify({'message': 'Lỗi gợi ý đơn vị'}), 500

@ai_bp.route('/suggest-units-stream', methods=['POST'])
@auth_required
def suggest_units_stream_endpoint():
    try:
        data = request.get_json()
        document_id = data.get('document_id', '')
        
        if not document_id:
            return jsonify({'message': 'Vui lòng cung cấp ID tài liệu'}), 400
        
        document = Document.get_by_id(document_id)
        if not document:
            return jsonify({'message': 'Không tìm thấy tài liệu'}), 404
        
        all_units = Unit.get_all()
        units_with_id = [Unit.to_dict(unit) for unit in all_units]
        
        if not units_with_id:
            def generate():
                yield f"data: {json.dumps({'suggested_units': [], 'suggested_ids': [], 'has_suggestions': False, 'message': 'Không có đơn vị phù hợp', 'is_final': True})}\n\n"
            return Response(stream_with_context(generate()), mimetype='text/event-stream')
        
        filepath = document.get('filepath', '')
        extracted_content = extract_text_from_file(filepath) if filepath else None
        
        def generate():
            all_suggested_ids = set()
            has_first_success = False
            
            try:
                for result in suggest_units_from_document_streaming(document, units_with_id):
                    if result.get('chunk_index', 0) > 0:
                        all_suggested_ids.update(result.get('suggested_ids', []))
                        has_first_success = True
                        
                        suggested_units = [unit for unit in units_with_id if unit['id'] in list(all_suggested_ids)[:5]]
                        
                        response_data = {
                            'suggested_units': suggested_units,
                            'suggested_ids': list(all_suggested_ids)[:5],
                            'has_suggestions': len(all_suggested_ids) > 0,
                            'message': result.get('message', ''),
                            'is_fallback': result.get('is_fallback', False),
                            'chunk_index': result.get('chunk_index', 0),
                            'total_chunks': result.get('total_chunks', 1),
                            'is_final': result.get('is_final', False),
                            'extracted_content': extracted_content[:1000] if extracted_content else None,
                            'extracted_length': len(extracted_content) if extracted_content else 0
                        }
                        
                        yield f"data: {json.dumps(response_data)}\n\n"
                        
                        if result.get('is_final', False):
                            break
                    elif result.get('is_fallback', False):
                        response_data = {
                            'suggested_units': [unit for unit in units_with_id if unit['id'] in result.get('suggested_ids', [])],
                            'suggested_ids': result.get('suggested_ids', []),
                            'has_suggestions': result.get('has_suggestions', False),
                            'message': result.get('message', ''),
                            'is_fallback': True,
                            'chunk_index': 0,
                            'total_chunks': 1,
                            'is_final': True,
                            'extracted_content': extracted_content[:1000] if extracted_content else None,
                            'extracted_length': len(extracted_content) if extracted_content else 0
                        }
                        yield f"data: {json.dumps(response_data)}\n\n"
                        break
            except Exception:
                error_data = {
                    'suggested_units': [],
                    'suggested_ids': [],
                    'has_suggestions': False,
                    'message': 'Lỗi xử lý',
                    'is_fallback': True,
                    'is_final': True
                }
                yield f"data: {json.dumps(error_data)}\n\n"
        
        return Response(stream_with_context(generate()), mimetype='text/event-stream')
    
    except Exception:
        return jsonify({'message': 'Lỗi gợi ý đơn vị'}), 500

@ai_bp.route('/preview-content', methods=['POST'])
@auth_required
def preview_content_endpoint():
    try:
        data = request.get_json()
        document_id = data.get('document_id', '')
        
        if not document_id:
            return jsonify({'message': 'Vui lòng cung cấp ID tài liệu'}), 400
        
        document = Document.get_by_id(document_id)
        if not document:
            return jsonify({'message': 'Không tìm thấy tài liệu'}), 404
        
        filepath = document.get('filepath', '')
        if not filepath:
            return jsonify({
                'extracted_content': None,
                'message': 'Không tìm thấy đường dẫn file'
            }), 200
        
        extracted_content = extract_text_from_file(filepath)
        
        if not extracted_content:
            file_ext = os.path.splitext(filepath)[1].lower()
            message = 'Không thể extract nội dung text từ file này.'
            if file_ext == '.pdf':
                message += ' File PDF này có thể là file ảnh (scanned PDF) hoặc không chứa text có thể đọc được.'
            
            return jsonify({
                'extracted_content': None,
                'message': message,
                'document_name': document.get('name', '')
            }), 200
        
        return jsonify({
            'extracted_content': extracted_content,
            'extracted_length': len(extracted_content),
            'document_name': document.get('name', ''),
            'filepath': filepath,
            'message': f'Đã extract {len(extracted_content)} ký tự từ file'
        }), 200
    
    except:
        return jsonify({'message': 'Lỗi đọc nội dung file'}), 500

